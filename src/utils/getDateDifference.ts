export const getDateDifference = (start: Date, end: Date) => {
  const oneDay = 24 * 60 * 60 * 1000; // in milliseconds
  if (typeof start === "string") {
    start = new Date(start);
  }
  if (typeof end === "string") {
    end = new Date(end);
  }
  const difference = end.getTime() - start.getTime();
  const daysDifference = Math.floor(difference / oneDay);
  return daysDifference;
};
