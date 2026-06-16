/**
 * CustomCellLayout.ets
 *
 * Provides VTable customLayout functions for special ReportTable cell features:
 * - progressStyle (progress bar background)
 * - floatIcon (floating icon overlay)
 * - extraText (corner badge text)
 * - isForbidden (diagonal strike line)
 * - boxLineColor (inner border box)
 * - classificationLinePosition (classification separator lines)
 * - richText (rich text rendering)
 * - gradient (gradient background)
 * - lock icon (锁列图标, referencing iOS customImageView)
 */

// Lock icon SVG paths (inline, no external resource dependency)
const LOCK_ICON_PATH = 'M12 2C9.24 2 7 4.24 7 7V10H5V20H19V10H17V7C17 4.24 14.76 2 12 2ZM9 7C9 5.34 10.34 4 12 4S15 5.34 15 7V10H9V7ZM12 17C10.9 17 10 16.1 10 15S10.9 13 12 13 14 13.9 14 15 13.1 17 12 17Z';
const UNLOCK_ICON_PATH = 'M12 2C9.24 2 7 4.24 7 7H9C9 5.34 10.34 4 12 4S15 5.34 15 7V10H5V20H19V10H17V7C17 4.24 14.76 2 12 2ZM12 17C10.9 17 10 16.1 10 15S10.9 13 12 13 14 13.9 14 15 13.1 17 12 17Z';

/**
 * Create a headerCustomLayout function for VTable header cells that renders
 * a lock/unlock icon beside the column title.
 * References iOS ReportTableCell's lockImageView/customImageView pattern:
 * - positioned to the right of the label text
 * - centered vertically
 * - size: 13x14 (matching iOS lockImageView constraints)
 *
 * @param {object} columnLockInfoMap - Map of { [colIndex]: { showLock, isLocked } }
 * @param {function} onLockToggle - Callback when lock icon is tapped: (colIndex, newLocked) => void
 */
export function createHeaderCustomLayout(columnLockInfoMap: ESObject, onLockToggle: (col: number, locked: boolean) => void) {
  return (args: ESObject): ESObject | null => {
    const table: ESObject = args.table;
    const row: number = args.row;
    const col: number = args.col;
    const rect: ESObject = args.rect;
    const width: number = rect.width;
    const height: number = rect.height;

    const lockInfo: ESObject = columnLockInfoMap[col];
    if (!lockInfo || !lockInfo.showLock) return null;

    const VRender: ESObject = args.VRender ?? {};
    const Group: ESObject = VRender.Group;
    const Text: ESObject = VRender.Text;
    const Image: ESObject = VRender.Image;
    const Rect: ESObject = VRender.Rect;
    const Path: ESObject = VRender.Path;
    if (!Group) return null;

    const group: ESObject = new Group({ x: 0, y: 0, width, height });

    // Get header text to calculate lock icon position
    const cellValue: string = (table.getCellValue(col, row) ?? '') as string;
    const headerStyle: ESObject = table.getCellStyle(col, row) ?? {};
    const fontSize: number = (headerStyle.fontSize ?? 14) as number;
    const textColor: string = (headerStyle.color ?? '#222222') as string;
    const fontWeight: string = (headerStyle.fontWeight ?? 'normal') as string;
    const textAlign: string = (headerStyle.textAlign ?? 'left') as string;
    const padding: ESObject = headerStyle.padding ?? [0, 12];
    const paddingLeft: number = Array.isArray(padding) ? ((padding[1] ?? 12) as number) : 12;
    const paddingRight: number = Array.isArray(padding) ? ((padding[1] ?? 12) as number) : 12;

    // Lock icon dimensions (matching iOS: width=13, height=14)
    const lockIconWidth = 13;
    const lockIconHeight = 14;
    const lockIconPadding = 4; // gap between text and icon (iOS offset:4)

    // Estimate text width (approximate: average char width ≈ fontSize * 0.6)
    const estimatedTextWidth = Math.min(
      cellValue.length * fontSize * 0.55,
      width - paddingLeft - paddingRight - lockIconWidth - lockIconPadding
    );

    // Calculate text x position
    let textX = paddingLeft;
    if (textAlign === 'center') {
      textX = (width - estimatedTextWidth - lockIconWidth - lockIconPadding) / 2;
    } else if (textAlign === 'right') {
      textX = width - paddingRight - estimatedTextWidth - lockIconWidth - lockIconPadding;
    }

    // Draw header text
    const textNode = new Text({
      x: textX,
      y: height / 2,
      text: cellValue,
      fontSize,
      fill: textColor,
      fontWeight,
      textAlign: 'left',
      textBaseline: 'middle',
      maxLineWidth: estimatedTextWidth,
      ellipsis: '...',
    });
    group.add(textNode);

    // Draw lock icon to the right of text (matching iOS lockImageView position)
    const lockX = textX + estimatedTextWidth + lockIconPadding;
    const lockY = Math.max(2, Math.min(height - lockIconHeight - 2, (height - lockIconHeight) / 2));

    // Icon color: locked = darker, unlocked = lighter
    const iconColor = lockInfo.isLocked ? '#333333' : '#999999';

    // Draw lock icon using path (SVG-like)
    // Use a simplified rectangle + arc approach for lock/unlock
    const iconPath = lockInfo.isLocked ? LOCK_ICON_PATH : UNLOCK_ICON_PATH;
    const pathNode = new Path({
      x: lockX,
      y: lockY,
      width: lockIconWidth,
      height: lockIconHeight,
      path: iconPath,
      fill: iconColor,
      scaleX: lockIconWidth / 24, // SVG viewBox is 24x24
      scaleY: lockIconHeight / 24,
    });
    group.add(pathNode);

    // Invisible hit area for click detection on the lock icon
    const hitAreaY = Math.max(0, Math.min(height - lockIconHeight - 8, lockY - 4));
    const hitArea = new Rect({
      x: lockX - 4,
      y: hitAreaY,
      width: lockIconWidth + 8,
      height: lockIconHeight + 8,
      fill: 'transparent',
      cursor: 'pointer',
    });
    hitArea.addEventListener('click', () => {
      onLockToggle(col, !lockInfo.isLocked);
    });
    group.add(hitArea);

    return {
      rootContainer: group,
      renderDefault: false,
    };
  };
}

/**
 * Create a customLayout function for VTable columns that renders
 * special ReportTable cell features using the Canvas drawing API.
 *
 * This function is passed as the `customLayout` field in column definitions.
 * VTable calls it for each cell, providing the cell context and expecting
 * a group of VRender primitives in return.
 */
export function createCustomCellLayout(defaultItemConfig: ESObject) {
  return (args: ESObject): ESObject | null => {
    const table: ESObject = args.table;
    const row: number = args.row;
    const col: number = args.col;
    const rect: ESObject = args.rect;
    const width: number = rect.width;
    const height: number = rect.height;
    const record: ESObject = table.getRecordByCell(col, row);
    if (!record) return null;

    const meta: ESObject = record[`__meta_${col}`];
    if (!meta) return null;

    const VRender: ESObject = args.VRender ?? {};
    const Group: ESObject = VRender.Group;
    const Text: ESObject = VRender.Text;
    const Rect: ESObject = VRender.Rect;
    const Line: ESObject = VRender.Line;
    const Image: ESObject = VRender.Image;
    if (!Group) return null;

    const group: ESObject = new Group({
      x: 0,
      y: 0,
      width,
      height,
    });

    // ---- 1. Gradient background ----
    if (meta.gradient) {
      const colors: ESObject = meta.gradient.colors;
      const start: ESObject = meta.gradient.start;
      const end: ESObject = meta.gradient.end;
      const gradRect: ESObject = new Rect({
        x: 0,
        y: 0,
        width,
        height,
        fill: {
          gradient: 'linear',
          x0: start.x * width,
          y0: start.y * height,
          x1: end.x * width,
          y1: end.y * height,
          stops: colors.map((c: string, i: number) => ({
            offset: i / (colors.length - 1),
            color: c,
          })),
        },
      });
      group.add(gradRect);
    }

    // ---- 2. Background color (cell-level override) ----
    if (meta.backgroundColor && !meta.gradient) {
      const bgRect = new Rect({
        x: 0,
        y: 0,
        width,
        height,
        fill: meta.backgroundColor,
      });
      group.add(bgRect);
    }

    // ---- 3. Progress bar ----
    if (meta.progressStyle) {
      const ps = meta.progressStyle;
      const pHeight = ps.height ?? defaultItemConfig?.progressStyle?.height ?? 20;
      const cornerRadius = ps.cornerRadius ?? defaultItemConfig?.progressStyle?.cornerRadius ?? 1;
      const marginH = ps.marginHorizontal ?? defaultItemConfig?.progressStyle?.marginHorizontal ?? 8;
      const barWidth = width - marginH * 2;
      const startX = marginH + barWidth * (ps.startRatio ?? 0);
      const endX = marginH + barWidth * (ps.endRatio ?? 0);
      const barY = (height - pHeight) / 2;

      // Draw progress bar with gradient
      if (ps.colors && ps.colors.length > 0) {
        const progressRect = new Rect({
          x: startX,
          y: barY,
          width: endX - startX,
          height: pHeight,
          cornerRadius,
          fill: ps.colors.length === 1
            ? ps.colors[0]
            : {
                gradient: 'linear',
                x0: 0,
                y0: 0,
                x1: endX - startX,
                y1: 0,
                stops: ps.colors.map((c: string, i: number) => ({
                  offset: i / (ps.colors.length - 1),
                  color: c,
                })),
              },
        });
        group.add(progressRect);
      }

      // Draw ants line (dashed line indicator)
      const antsLine = ps.antsLineStyle ?? defaultItemConfig?.progressStyle?.antsLineStyle;
      if (antsLine && antsLine.lineRatio != null) {
        const lineX = marginH + barWidth * antsLine.lineRatio;
        const dashLine = new Line({
          points: [
            { x: lineX, y: barY },
            { x: lineX, y: barY + pHeight },
          ],
          stroke: antsLine.color ?? '#222222',
          lineWidth: antsLine.lineWidth ?? 0.5,
          lineDash: antsLine.lineDashPattern ?? [4, 2],
        });
        group.add(dashLine);
      }
    }

    // ---- 4. Main text ----
    const textPaddingLeft = meta.textPaddingLeft ?? meta.textPaddingHorizontal ?? defaultItemConfig?.textPaddingHorizontal ?? 12;
    const textPaddingRight = meta.textPaddingRight ?? meta.textPaddingHorizontal ?? defaultItemConfig?.textPaddingHorizontal ?? 12;
    const fontSize = meta.fontSize ?? defaultItemConfig?.fontSize ?? 14;
    const textColor = meta.textColor ?? defaultItemConfig?.textColor ?? '#222222';
    const fontWeight = meta.fontWeight ?? (defaultItemConfig?.isOverstriking ? 'bold' : 'normal');
    const textAlign = meta.textAlign ?? 'left';

    let textX = textPaddingLeft;
    if (textAlign === 'center') {
      textX = width / 2;
    } else if (textAlign === 'right') {
      textX = width - textPaddingRight;
    }

    // Handle richText
    if (meta.richText && meta.richText.length > 0) {
      // VTable supports richText natively - map to VRender text segments
      let currentX = textPaddingLeft;
      const textY = height / 2;

      for (const segment of meta.richText) {
        const segStyle = segment.style ?? {};
        const segFontSize = segStyle.fontSize ?? fontSize;
        const segColor = segStyle.textColor ?? textColor;
        const segWeight = segStyle.isOverstriking ? 'bold' : fontWeight;

        const textNode = new Text({
          x: currentX,
          y: textY,
          text: segment.text,
          fontSize: segFontSize,
          fill: segColor,
          fontWeight: segWeight,
          textBaseline: 'middle',
          textDecoration: segStyle.strikethrough ? 'line-through' : 'none',
        });

        // Background for text segment
        if (segStyle.backgroundColor) {
          const segPadH = segStyle.paddingHorizontal ?? segFontSize * 0.4;
          const segH = segStyle.height ?? segFontSize * 1.5;
          const bgNode = new Rect({
            x: currentX - segPadH,
            y: textY - segH / 2,
            width: segment.text.length * segFontSize * 0.6 + segPadH * 2,
            height: segH,
            fill: segStyle.backgroundColor,
            cornerRadius: segStyle.borderRadius ?? 0,
            stroke: segStyle.borderColor,
            lineWidth: segStyle.borderWidth ?? 0,
          });
          group.add(bgNode);
        }

        group.add(textNode);
        currentX += segment.text.length * segFontSize * 0.6 + 4;
      }
    } else {
      // Simple text
      const mainText = new Text({
        x: textX,
        y: height / 2,
        text: meta.title ?? '',
        fontSize,
        fill: textColor,
        fontWeight,
        textAlign,
        textBaseline: 'middle',
        maxLineWidth: width - textPaddingLeft - textPaddingRight,
        ellipsis: '...',
      });
      group.add(mainText);
    }

    // ---- 5. Extra text (corner badge) ----
    if (meta.extraText) {
      const et = meta.extraText;
      const bgStyle = et.backgroundStyle ?? {};
      const textStyle = et.style ?? {};
      const isLeft = et.isLeft ?? false;

      const badgeW = bgStyle.width ?? 20;
      const badgeH = bgStyle.height ?? 14;
      const badgeX = isLeft ? textPaddingLeft : width - textPaddingRight - badgeW;
      const badgeY = Math.max(2, Math.min(height - badgeH - 2, 2));

      // Badge background
      const badgeBg = new Rect({
        x: badgeX,
        y: badgeY,
        width: badgeW,
        height: badgeH,
        fill: bgStyle.color ?? '#ff0000',
        cornerRadius: bgStyle.radius ?? 2,
      });
      group.add(badgeBg);

      // Badge text
      const badgeText = new Text({
        x: badgeX + badgeW / 2,
        y: badgeY + badgeH / 2,
        text: et.text ?? '',
        fontSize: textStyle.fontSize ?? 10,
        fill: textStyle.color ?? '#ffffff',
        textAlign: 'center',
        textBaseline: 'middle',
      });
      group.add(badgeText);
    }

    // ---- 6. Float icon ----
    if (meta.floatIcon) {
      const fi = meta.floatIcon;
      let iconX = 0;
      let iconY = 0;

      if (fi.left != null) iconX = fi.left;
      else if (fi.right != null) iconX = width - fi.right - (fi.width ?? 16);

      if (fi.top != null) iconY = fi.top;
      else if (fi.bottom != null) iconY = height - fi.bottom - (fi.height ?? 16);
      const iconH = fi.height ?? 16;
      const constrainedIconY = Math.max(2, Math.min(height - iconH - 2, iconY));

      const iconNode = new Image({
        x: iconX,
        y: constrainedIconY,
        width: fi.width ?? 16,
        height: fi.height ?? 16,
        image: fi.name ?? fi.path?.uri ?? '',
      });
      group.add(iconNode);
    }

    // ---- 7. Forbidden line (diagonal) ----
    if (meta.isForbidden) {
      const forbiddenLine = new Line({
        points: [
          { x: 0, y: 0 },
          { x: width, y: height },
        ],
        stroke: '#ff0000',
        lineWidth: 1,
      });
      group.add(forbiddenLine);
    }

    // ---- 8. Box line (inner border) ----
    if (meta.boxLineColor) {
      const boxRect = new Rect({
        x: 0.5,
        y: 0.5,
        width: width - 1,
        height: height - 1,
        stroke: meta.boxLineColor,
        lineWidth: 1,
        fill: 'transparent',
      });
      group.add(boxRect);
    }

    // ---- 9. Classification line position ----
    if (meta.classificationLinePosition && meta.classificationLinePosition > 0) {
      const clColor = meta.classificationLineColor ?? defaultItemConfig?.classificationLineColor ?? '#9cb3c8';
      const pos = meta.classificationLinePosition;

      // top = 1, right = 2, bottom = 4, left = 8
      if (pos & 1) {
        group.add(new Line({
          points: [{ x: 0, y: 0 }, { x: width, y: 0 }],
          stroke: clColor,
          lineWidth: 1,
        }));
      }
      if (pos & 2) {
        group.add(new Line({
          points: [{ x: width, y: 0 }, { x: width, y: height }],
          stroke: clColor,
          lineWidth: 1,
        }));
      }
      if (pos & 4) {
        group.add(new Line({
          points: [{ x: 0, y: height }, { x: width, y: height }],
          stroke: clColor,
          lineWidth: 1,
        }));
      }
      if (pos & 8) {
        group.add(new Line({
          points: [{ x: 0, y: 0 }, { x: 0, y: height }],
          stroke: clColor,
          lineWidth: 1,
        }));
      }
    }

    return {
      rootContainer: group,
      renderDefault: false,
    };
  };
}
