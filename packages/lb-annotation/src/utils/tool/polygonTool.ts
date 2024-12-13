import { ELineTypes, SEGMENT_NUMBER } from '../../constant/tool';
import { IPolygonPoint } from '../../types/tool/polygon';
// 计算曲线的值
export function createSmoothCurvePoints(
  points: any[],
  tension: number = 0.5,
  closed: boolean = false,
  numberOfSegments: number = 16,
) {
  if (points.length < 4) {
    return points;
  }

  const result = []; // result points
  const ps = points.slice(0); // clone array so we don't change the original
  let x;
  let y; // our x,y coords
  let t1x;
  let t2x;
  let t1y;
  let t2y; // tension vectors
  let c1;
  let c2;
  let c3;
  let c4; // cardinal points
  let st;
  let t;
  let i; // steps based on number of segments

  // The algorithm require a previous and next point to the actual point array.
  // Check if we will draw closed or open curve.
  // If closed, copy end points to beginning and first points to end
  // If open, duplicate first points to befinning, end points to end
  if (closed) {
    ps.unshift(points[points.length - 1]);
    ps.unshift(points[points.length - 2]);
    ps.unshift(points[points.length - 1]);
    ps.unshift(points[points.length - 2]);
    ps.push(points[0]);
    ps.push(points[1]);
  } else {
    ps.unshift(points[1]); // copy 1st point and insert at beginning
    ps.unshift(points[0]);
    ps.push(points[points.length - 2]); // copy last point and append
    ps.push(points[points.length - 1]);
  }

  // 1. loop goes through point array
  // 2. loop goes through each segment between the 2 points + 1e point before and after
  for (i = 2; i < ps.length - 4; i += 2) {
    // calculate tension vectors
    t1x = (ps[i + 2] - ps[i - 2]) * tension;
    t2x = (ps[i + 4] - ps[i - 0]) * tension;
    t1y = (ps[i + 3] - ps[i - 1]) * tension;
    t2y = (ps[i + 5] - ps[i + 1]) * tension;

    for (t = 0; t <= numberOfSegments; t++) {
      // calculate step
      st = t / numberOfSegments;

      // calculate cardinals
      c1 = 2 * Math.pow(st, 3) - 3 * Math.pow(st, 2) + 1;
      c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2);
      c3 = Math.pow(st, 3) - 2 * Math.pow(st, 2) + st;
      c4 = Math.pow(st, 3) - Math.pow(st, 2);

      // calculate x and y cords with common control vectors
      x = c1 * ps[i] + c2 * ps[i + 2] + c3 * t1x + c4 * t2x;
      y = c1 * ps[i + 1] + c2 * ps[i + 3] + c3 * t1y + c4 * t2y;

      // store points in array
      result.push(x);
      result.push(y);
    }
  }

  const formatResult = [];

  for (let j = 0; j < result.length - 1; j += 2) {
    formatResult.push({
      x: result[j],
      y: result[j + 1],
    });
  }

  if (closed) {
    // 需要将前面的 21 个点补充到最后
    for (let j = 0; j < numberOfSegments + 1; j++) {
      const d: any = formatResult.shift();
      formatResult.push(d);
    }
  }

  // 所以一个线段有 21 个点
  return formatResult;
}

/**
 * 通过数据转换为平滑曲线的点提交 [{x: number, y: number}...] => [x, ...smoothCurvePoints ,y]
 * @param pointList
 * @returns {Array<number>}
 */
export const createSmoothCurvePointsFromPointList = (
  pointList: Array<{ x: number; y: number }>,
  numberOfSegments: number = 16,
) =>
  createSmoothCurvePoints(
    pointList.reduce((acc: number[], cur: { x: number; y: number }) => {
      return [...acc, cur.x, cur.y];
    }, []),
    0.5,
    false,
    numberOfSegments,
  );

/**
 * 获取当前的坐标是否在多边形内
 *
 * @export
 * @param {IPolygonPoint} checkPoint
 * @param {IPolygonPoint[]} polygonPoints
 * @returns {boolean}
 */
export function isInPolygon(
  checkPoint: IPolygonPoint,
  polygonPoints: IPolygonPoint[],
  lineType: ELineTypes = ELineTypes.Line,
): boolean {
  let counter = 0;
  let p1;
  let p2;

  // 复制和预处理多边形点
  if (lineType === ELineTypes.Curve) {
    polygonPoints = createSmoothCurvePoints(
      polygonPoints.flatMap((point) => [point.x, point.y]),
      0.5,
      true,
      SEGMENT_NUMBER,
    );
  }

  // 快速边界检查
  const [minX, maxX, minY, maxY]: [number, number, number, number] = polygonPoints.reduce(
    ([accMinX, accMaxX, accMinY, accMaxY], { x, y }) => [
      Math.min(accMinX, x),
      Math.max(accMaxX, x),
      Math.min(accMinY, y),
      Math.max(accMaxY, y),
    ],
    [Infinity, -Infinity, Infinity, -Infinity],
  );

  if (checkPoint.x < minX || checkPoint.x > maxX || checkPoint.y < minY || checkPoint.y > maxY) {
    return false;
  }

  // 核心射线法判断
  p1 = polygonPoints[polygonPoints.length - 1];
  for (let i = 0; i < polygonPoints.length; i++) {
    p2 = polygonPoints[i];

    // 判断是否跨越Y轴
    if (checkPoint.y > Math.min(p1.y, p2.y) && checkPoint.y <= Math.max(p1.y, p2.y)) {
      if (checkPoint.x <= Math.max(p1.x, p2.x)) {
        // 计算交点
        const xinters = p1.y !== p2.y ? ((checkPoint.y - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y) + p1.x : p1.x;

        if (checkPoint.x <= xinters) {
          counter++;
        }
      }
    }
    p1 = p2;

    // 提前退出
    if (counter % 2 !== 0 && i > polygonPoints.length / 2) {
      break;
    }
  }

  // 奇偶性判断
  return counter % 2 !== 0;
}

/**
 * 获取当 zoom 更改后的 pointList
 * @param pointList
 * @param zoom
 */
export function getPolygonPointUnderZoom(pointList: IPolygonPoint[], zoom = 1) {
  return pointList.map((v) => ({ ...v, x: v.x * zoom, y: v.y * zoom }));
}
