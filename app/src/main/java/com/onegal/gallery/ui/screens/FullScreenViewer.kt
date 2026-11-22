package com.onegal.gallery.ui.screens

import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.view.TextureView
import android.view.ViewGroup
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.calculatePan
import androidx.compose.foundation.gestures.calculateZoom
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.VolumeOff
import androidx.compose.material.icons.automirrored.rounded.VolumeUp
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.DriveFileRenameOutline
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Speed
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem as ExoMediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import com.onegal.gallery.data.model.ExifDetails
import com.onegal.gallery.data.model.MediaItem
import com.onegal.gallery.ui.components.formatDurationMs
import com.onegal.gallery.ui.theme.OneUiColors
import com.onegal.gallery.ui.theme.OneUiMotion
import com.onegal.gallery.ui.theme.oneUiGlass
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs

/**
 * Full-screen One UI 8.0 Media Viewer (v2):
 * - HorizontalPager with beyondViewportPageCount = 2 for instant zero-jank 120Hz swiping
 * - Pure monochrome frosted-glass floating top/bottom toolbars with 0.75.dp specular borders
 * - Tuned One UI spring physics (dampingRatio = 0.85f) for swipe-down dismiss & swipe-up details
 * - Respects Full Screen Scrolling & Show Full Location/EXIF privacy toggles
 * - Embedded Media3 ExoPlayer with auto-play, mute, timeline scrubber, speed (0.5x..2.0x), and PNG capture
 */
@Composable
fun FullScreenViewer(
    items: List<MediaItem>,
    initialIndex: Int,
    exifDetails: ExifDetails?,
    autoPlayVideos: Boolean,
    fullScreenScrolling: Boolean,
    showFullExifLocation: Boolean,
    onPageChanged: (Int) -> Unit,
    onDismiss: () -> Unit,
    onFavoriteClick: (MediaItem) -> Unit,
    onShareClick: (MediaItem) -> Unit,
    onCopyClick: (MediaItem) -> Unit,
    onRenameClick: (MediaItem) -> Unit,
    onDeleteClick: (MediaItem) -> Unit,
    onCaptureFrame: (Bitmap, String) -> Unit
) {
    if (items.isEmpty()) {
        onDismiss()
        return
    }

    val pagerState = rememberPagerState(
        initialPage = initialIndex.coerceIn(0, items.lastIndex),
        pageCount = { items.size }
    )
    val scope = rememberCoroutineScope()

    var showChrome by remember { mutableStateOf(true) }
    var showDetailsSheet by remember { mutableStateOf(false) }
    var isCurrentItemZoomed by remember { mutableStateOf(false) }

    val dismissOffsetY = remember { Animatable(0f) }
    var lastDragDelta by remember { mutableFloatStateOf(0f) }
    val dismissProgress = (abs(dismissOffsetY.value) / 420f).coerceIn(0f, 1f)
    val scaleOnDrag = (1f - dismissProgress * 0.28f).coerceIn(0.72f, 1f)
    val backdropAlpha = (1f - dismissProgress * 0.85f).coerceIn(0.15f, 1f)

    LaunchedEffect(pagerState) {
        snapshotFlow { pagerState.currentPage }.collect { page ->
            isCurrentItemZoomed = false
            onPageChanged(page)
        }
    }

    val currentItem = items.getOrElse(pagerState.currentPage) { items.first() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = backdropAlpha))
    ) {
        val pagerBaseModifier = if (fullScreenScrolling) {
            Modifier.fillMaxSize()
        } else {
            Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
        }

        HorizontalPager(
            state = pagerState,
            userScrollEnabled = !isCurrentItemZoomed,
            beyondViewportPageCount = 2,
            modifier = pagerBaseModifier
                .graphicsLayer {
                    translationY = dismissOffsetY.value
                    scaleX = scaleOnDrag
                    scaleY = scaleOnDrag
                }
                .pointerInput(isCurrentItemZoomed) {
                    if (!isCurrentItemZoomed) {
                        detectVerticalDragGestures(
                            onVerticalDrag = { _, dragAmount ->
                                lastDragDelta = dragAmount
                                scope.launch {
                                    dismissOffsetY.snapTo(dismissOffsetY.value + dragAmount)
                                }
                            },
                            onDragEnd = {
                                scope.launch {
                                    when {
                                        dismissOffsetY.value > 165f || (dismissOffsetY.value > 70f && lastDragDelta > 28f) -> {
                                            onDismiss()
                                        }
                                        dismissOffsetY.value < -130f || (dismissOffsetY.value < -60f && lastDragDelta < -28f) -> {
                                            dismissOffsetY.animateTo(0f, OneUiMotion.standardSpring())
                                            showDetailsSheet = true
                                        }
                                        else -> dismissOffsetY.animateTo(0f, OneUiMotion.standardSpring())
                                    }
                                    lastDragDelta = 0f
                                }
                            },
                            onDragCancel = {
                                lastDragDelta = 0f
                                scope.launch { dismissOffsetY.animateTo(0f, OneUiMotion.standardSpring()) }
                            }
                        )
                    }
                }
        ) { page ->
            val item = items[page]
            val isActivePage = page == pagerState.currentPage
            if (item.isVideo) {
                Media3VideoPage(
                    item = item,
                    isActivePage = isActivePage,
                    autoPlay = autoPlayVideos,
                    showControls = showChrome,
                    onToggleControls = { showChrome = !showChrome },
                    onCaptureFrame = { bitmap -> onCaptureFrame(bitmap, item.displayName) }
                )
            } else {
                ZoomablePhotoPage(
                    item = item,
                    onTap = { showChrome = !showChrome },
                    onZoomStateChanged = { zoomed ->
                        if (isActivePage) isCurrentItemZoomed = zoomed
                    }
                )
            }
        }

        // Top floating glassmorphic toolbar
        AnimatedVisibility(
            visible = showChrome && dismissProgress < 0.08f,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.TopCenter)
                .statusBarsPadding()
                .padding(horizontal = 12.dp, vertical = 10.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .oneUiGlass(isDarkTheme = true, cornerRadius = 24.dp, alpha = 0.84f)
                    .padding(horizontal = 6.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                        contentDescription = "Close viewer",
                        tint = Color.White
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = formatViewerTimestamp(currentItem.dateTakenMs),
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = currentItem.displayName,
                        style = MaterialTheme.typography.labelMedium,
                        color = OneUiColors.DarkTertiaryText,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                IconButton(onClick = { showDetailsSheet = true }) {
                    Icon(
                        imageVector = Icons.Rounded.Info,
                        contentDescription = "Media details",
                        tint = Color.White
                    )
                }
            }
        }

        // Bottom floating glassmorphic One UI action pill (photos only; videos render integrated playback deck)
        AnimatedVisibility(
            visible = showChrome && !currentItem.isVideo && dismissProgress < 0.08f,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(horizontal = 18.dp, vertical = 14.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .oneUiGlass(isDarkTheme = true, cornerRadius = 28.dp, alpha = 0.86f)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { onFavoriteClick(currentItem) }) {
                    Icon(
                        imageVector = if (currentItem.isFavorite) Icons.Rounded.Favorite else Icons.Rounded.FavoriteBorder,
                        contentDescription = "Favorite",
                        tint = Color.White
                    )
                }
                IconButton(onClick = { onShareClick(currentItem) }) {
                    Icon(Icons.Rounded.Share, contentDescription = "Share", tint = Color.White)
                }
                IconButton(onClick = { onCopyClick(currentItem) }) {
                    Icon(Icons.Rounded.ContentCopy, contentDescription = "Copy", tint = Color.White)
                }
                IconButton(onClick = { onRenameClick(currentItem) }) {
                    Icon(Icons.Rounded.DriveFileRenameOutline, contentDescription = "Rename", tint = Color.White)
                }
                IconButton(onClick = { onDeleteClick(currentItem) }) {
                    Icon(Icons.Rounded.DeleteOutline, contentDescription = "Delete", tint = Color.White)
                }
            }
        }
    }

    if (showDetailsSheet) {
        MediaDetailsBottomSheet(
            item = currentItem,
            exif = exifDetails,
            showFullExifLocation = showFullExifLocation,
            onDismiss = { showDetailsSheet = false }
        )
    }
}

@Composable
private fun ZoomablePhotoPage(
    item: MediaItem,
    onTap: () -> Unit,
    onZoomStateChanged: (Boolean) -> Unit
) {
    val context = LocalContext.current
    var scale by remember(item.id) { mutableFloatStateOf(1f) }
    var offset by remember(item.id) { mutableStateOf(Offset.Zero) }

    val imageRequest = remember(item.uri) {
        ImageRequest.Builder(context)
            .data(item.uri)
            .build()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(item.id) {
                detectTapGestures(
                    onTap = { onTap() },
                    onDoubleTap = { tapOffset ->
                        if (scale > 1.05f) {
                            scale = 1f
                            offset = Offset.Zero
                            onZoomStateChanged(false)
                        } else {
                            val target = 3f
                            val center = Offset(size.width / 2f, size.height / 2f)
                            scale = target
                            offset = (center - tapOffset) * (target - 1f)
                            onZoomStateChanged(true)
                        }
                    }
                )
            }
            .pointerInput(item.id) {
                awaitEachGesture {
                    awaitFirstDown(requireUnconsumed = false)
                    do {
                        val event = awaitPointerEvent()
                        val pointerCount = event.changes.count { it.pressed }
                        if (pointerCount >= 2 || scale > 1.02f) {
                            val zoomChange = event.calculateZoom()
                            val panChange = event.calculatePan()
                            val nextScale = (scale * zoomChange).coerceIn(1f, 10f)
                            val maxX = ((size.width * (nextScale - 1f)) / 2f).coerceAtLeast(0f)
                            val maxY = ((size.height * (nextScale - 1f)) / 2f).coerceAtLeast(0f)
                            val nextOffset = if (nextScale <= 1.01f) {
                                Offset.Zero
                            } else {
                                Offset(
                                    x = (offset.x + panChange.x).coerceIn(-maxX, maxX),
                                    y = (offset.y + panChange.y).coerceIn(-maxY, maxY)
                                )
                            }
                            scale = nextScale
                            offset = nextOffset
                            onZoomStateChanged(nextScale > 1.02f)
                            if (pointerCount >= 2 || nextScale > 1.02f) {
                                event.changes.forEach { it.consume() }
                            }
                        }
                    } while (event.changes.any { it.pressed })
                }
            },
        contentAlignment = Alignment.Center
    ) {
        AsyncImage(
            model = imageRequest,
            contentDescription = item.displayName,
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    translationX = offset.x
                    translationY = offset.y
                }
        )
    }
}

@Composable
private fun Media3VideoPage(
    item: MediaItem,
    isActivePage: Boolean,
    autoPlay: Boolean,
    showControls: Boolean,
    onToggleControls: () -> Unit,
    onCaptureFrame: (Bitmap) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val player = remember(item.uri) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(ExoMediaItem.fromUri(item.uri))
            repeatMode = Player.REPEAT_MODE_ONE
            prepare()
            playWhenReady = autoPlay && isActivePage
        }
    }

    var isPlaying by remember { mutableStateOf(autoPlay && isActivePage) }
    var isMuted by remember { mutableStateOf(false) }
    var playbackSpeed by remember { mutableFloatStateOf(1.0f) }
    var speedMenuExpanded by remember { mutableStateOf(false) }
    var currentPosMs by remember { mutableLongStateOf(0L) }
    var durationMs by remember { mutableLongStateOf(item.durationMs.coerceAtLeast(1L)) }
    var isScrubbing by remember { mutableStateOf(false) }
    var scrubPositionMs by remember { mutableLongStateOf(0L) }
    var playerViewRef by remember { mutableStateOf<PlayerView?>(null) }

    LaunchedEffect(isActivePage) {
        if (isActivePage) {
            if (autoPlay) player.play()
        } else {
            player.pause()
        }
    }

    DisposableEffect(player) {
        val listener = object : Player.Listener {
            override fun onIsPlayingChanged(playing: Boolean) {
                isPlaying = playing
            }

            override fun onPlaybackStateChanged(playbackState: Int) {
                if (player.duration > 0L) durationMs = player.duration
            }
        }
        player.addListener(listener)
        onDispose {
            player.removeListener(listener)
            player.release()
        }
    }

    LaunchedEffect(player, isActivePage) {
        while (true) {
            if (isActivePage && !isScrubbing) {
                currentPosMs = player.currentPosition.coerceAtLeast(0L)
                if (player.duration > 0L) durationMs = player.duration
            }
            delay(80L)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .clickable(onClick = onToggleControls)
    ) {
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    this.player = player
                    useController = false
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    playerViewRef = this
                }
            },
            update = { view ->
                view.player = player
                playerViewRef = view
            },
            modifier = Modifier.fillMaxSize()
        )

        AnimatedVisibility(
            visible = showControls,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(horizontal = 12.dp, vertical = 12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .oneUiGlass(isDarkTheme = true, cornerRadius = 26.dp, alpha = 0.86f)
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                if (isScrubbing) {
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color.White,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text(
                            text = "${formatDurationMs(scrubPositionMs)} / ${formatDurationMs(durationMs)}",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = Color.Black,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                }

                // Pure monochrome One UI timeline scrubber
                val sliderPos = if (isScrubbing) scrubPositionMs else currentPosMs
                Slider(
                    value = sliderPos.toFloat().coerceIn(0f, durationMs.toFloat().coerceAtLeast(1f)),
                    onValueChange = { next ->
                        isScrubbing = true
                        scrubPositionMs = next.toLong()
                    },
                    onValueChangeFinished = {
                        player.seekTo(scrubPositionMs)
                        currentPosMs = scrubPositionMs
                        isScrubbing = false
                    },
                    valueRange = 0f..durationMs.toFloat().coerceAtLeast(1f),
                    colors = SliderDefaults.colors(
                        thumbColor = Color.White,
                        activeTrackColor = Color.White,
                        inactiveTrackColor = Color.White.copy(alpha = 0.24f)
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = formatDurationMs(sliderPos),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.88f)
                    )
                    Text(
                        text = formatDurationMs(durationMs),
                        style = MaterialTheme.typography.labelSmall,
                        color = OneUiColors.DarkSecondaryText
                    )
                }

                Spacer(Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = {
                        if (player.isPlaying) player.pause() else player.play()
                    }) {
                        Icon(
                            imageVector = if (isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                            contentDescription = if (isPlaying) "Pause" else "Play",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    IconButton(onClick = {
                        isMuted = !isMuted
                        player.volume = if (isMuted) 0f else 1f
                    }) {
                        Icon(
                            imageVector = if (isMuted) Icons.AutoMirrored.Rounded.VolumeOff else Icons.AutoMirrored.Rounded.VolumeUp,
                            contentDescription = if (isMuted) "Unmute" else "Mute",
                            tint = Color.White
                        )
                    }

                    Box {
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = Color.White.copy(alpha = 0.14f),
                            modifier = Modifier.clickable { speedMenuExpanded = true }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Speed,
                                    contentDescription = "Playback speed",
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(Modifier.width(5.dp))
                                Text(
                                    text = "${playbackSpeed}x",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Color.White
                                )
                            }
                        }

                        DropdownMenu(
                            expanded = speedMenuExpanded,
                            onDismissRequest = { speedMenuExpanded = false },
                            containerColor = OneUiColors.DarkGlassSurface,
                            shape = RoundedCornerShape(18.dp)
                        ) {
                            listOf(0.5f, 1.0f, 1.5f, 2.0f).forEach { speed ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            text = "${speed}x",
                                            fontWeight = if (speed == playbackSpeed) FontWeight.Bold else FontWeight.Normal,
                                            color = if (speed == playbackSpeed) Color.White else OneUiColors.DarkSecondaryText
                                        )
                                    },
                                    onClick = {
                                        playbackSpeed = speed
                                        player.playbackParameters = PlaybackParameters(speed)
                                        speedMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Crisp monochrome white Frame Capture pill button
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color.White,
                        modifier = Modifier.clickable {
                            val capturePosUs = player.currentPosition * 1000L
                            scope.launch {
                                val surfaceBitmap = (playerViewRef?.videoSurfaceView as? TextureView)?.bitmap
                                val bitmap = surfaceBitmap ?: withContext(Dispatchers.IO) {
                                    val retriever = MediaMetadataRetriever()
                                    try {
                                        retriever.setDataSource(context, item.uri)
                                        retriever.getFrameAtTime(
                                            capturePosUs,
                                            MediaMetadataRetriever.OPTION_CLOSEST
                                        )
                                    } catch (_: Exception) {
                                        null
                                    } finally {
                                        retriever.release()
                                    }
                                }
                                if (bitmap != null) {
                                    onCaptureFrame(bitmap)
                                }
                            }
                        }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.CameraAlt,
                                contentDescription = "Capture frame",
                                tint = Color.Black,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = "Capture",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                                color = Color.Black
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MediaDetailsBottomSheet(
    item: MediaItem,
    exif: ExifDetails?,
    showFullExifLocation: Boolean,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        shape = RoundedCornerShape(topStart = 26.dp, topEnd = 26.dp),
        containerColor = MaterialTheme.colorScheme.surfaceVariant
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 22.dp)
                .padding(bottom = 32.dp)
        ) {
            Text(
                text = "Details",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.height(16.dp))

            DetailRow("File name", item.displayName)
            DetailRow("Date & time", formatViewerTimestamp(item.dateTakenMs))
            DetailRow(
                "Resolution",
                if ((exif?.width ?: item.width) > 0) "${exif?.width ?: item.width} × ${exif?.height ?: item.height} px"
                else "Auto-detected"
            )
            DetailRow("File size", formatBytes(item.sizeBytes))
            DetailRow("MIME type", item.mimeType)
            if (item.isVideo && item.durationMs > 0L) {
                DetailRow("Duration", formatDurationMs(item.durationMs))
            }
            DetailRow("Storage path", "${item.relativePath}${item.displayName}")

            if (showFullExifLocation && exif != null && (exif.cameraModel != null || exif.aperture != null || exif.iso != null)) {
                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 12.dp),
                    color = MaterialTheme.colorScheme.outlineVariant
                )
                Text(
                    text = "Camera EXIF & Location",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(Modifier.height(10.dp))
                val cameraLabel = listOfNotNull(exif.cameraMake, exif.cameraModel).joinToString(" ").ifBlank { null }
                cameraLabel?.let { DetailRow("Device", it) }
                exif.lensModel?.let { DetailRow("Lens", it) }
                val exposureSummary = listOfNotNull(exif.aperture, exif.exposureTime, exif.focalLength, exif.iso)
                    .joinToString("  ·  ")
                    .ifBlank { null }
                exposureSummary?.let { DetailRow("Exposure", it) }
                exif.gpsCoordinates?.let { DetailRow("GPS", it) }
            } else if (!showFullExifLocation) {
                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 12.dp),
                    color = MaterialTheme.colorScheme.outlineVariant
                )
                Text(
                    text = "Full EXIF & GPS location hidden (configurable in Gallery settings)",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 6.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

private fun formatViewerTimestamp(epochMs: Long): String {
    return SimpleDateFormat("EEE, MMM d, yyyy · h:mm a", Locale.US).format(Date(epochMs))
}
