export function orderPoints(pts) {
  let rect = new Array(4);

  let sum = pts.map(p => p.x + p.y);
  rect[0] = pts[sum.indexOf(Math.min(...sum))]; // top-left
  rect[2] = pts[sum.indexOf(Math.max(...sum))]; // bottom-right

  let diff = pts.map(p => p.x - p.y);
  rect[1] = pts[diff.indexOf(Math.min(...diff))]; // top-right
  rect[3] = pts[diff.indexOf(Math.max(...diff))]; // bottom-left

  return rect;
}
