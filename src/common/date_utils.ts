export function getLast2DaysDate(date: Date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  date.setDate(date.getDate() - 1);
  return date;
}

export function getDayStart(
  date: Date,
  dayStartTimeHours: number,
  dayStartTimeMinutes: number,
) {
  const copyDate = new Date(date);
  if (
    (copyDate.getHours() < dayStartTimeHours ||
      (copyDate.getHours() == dayStartTimeHours &&
        copyDate.getMinutes() < dayStartTimeMinutes)) &&
    dayStartTimeHours < 12
  ) {
    // late night hours before limit - consider as previous day still
    copyDate.setDate(copyDate.getDate() - 1);
  }

  copyDate.setHours(dayStartTimeHours);
  copyDate.setMinutes(dayStartTimeMinutes);

  return copyDate;
}

export function getActualWeekDayByDate(
  date: Date,
  dayStartTimeHours: number,
  dayStartTimeMinutes: number,
) {
  // returns the actual date according to dayStartTimeHours/dayStartTimeMinutes values
  const dayStart = getDayStart(date, dayStartTimeHours, dayStartTimeMinutes);

  // if current time is before day start (meaning next day starts at the evening)
  // then increment day because it was started in the before evening (wednesday night => thursday)
  if (date < dayStart) {
    dayStart.setDate(dayStart.getDate() + 1);
  }

  return dayStart.getDay();
}
