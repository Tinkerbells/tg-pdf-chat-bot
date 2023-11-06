export const getDateDifference = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  const difference = Math.abs(date1.getTime() - date2.getTime());
  const daysDifference = Math.floor(difference / oneDay);

  return daysDifference;
};
