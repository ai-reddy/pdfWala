// Calendar-aware age/date-difference math (spec sections 9/10). Deliberately
// avoids naive year subtraction so month/day borrowing is handled correctly.
export interface CalendarDiff {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

export function calendarDifference(start: Date, end: Date): CalendarDiff {
  if (end < start) throw new Error("End date must be on or after the start date.");

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    // Borrow days from the month preceding `end`.
    const prevMonthIndex = (end.getMonth() - 1 + 12) % 12;
    const prevMonthYear = end.getMonth() === 0 ? end.getFullYear() - 1 : end.getFullYear();
    days += daysInMonth(prevMonthYear, prevMonthIndex);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay);

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
  };
}

export interface AgeResult extends CalendarDiff {
  nextBirthday: Date;
  daysUntilBirthday: number;
}

// Leap-day (Feb 29) birthdays: the next birthday in a non-leap year is
// observed on Feb 28, matching common civil-calendar convention.
export function calculateAge(dateOfBirth: Date, asOf: Date = new Date()): AgeResult {
  const diff = calendarDifference(dateOfBirth, asOf);

  let nextBirthdayYear = asOf.getFullYear();
  const isLeapDay = dateOfBirth.getMonth() === 1 && dateOfBirth.getDate() === 29;
  const makeBirthday = (year: number) => {
    if (isLeapDay) {
      const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      return new Date(year, 1, leap ? 29 : 28);
    }
    return new Date(year, dateOfBirth.getMonth(), dateOfBirth.getDate());
  };

  let nextBirthday = makeBirthday(nextBirthdayYear);
  if (nextBirthday < new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate())) {
    nextBirthdayYear += 1;
    nextBirthday = makeBirthday(nextBirthdayYear);
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilBirthday = Math.round(
    (nextBirthday.getTime() - new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate()).getTime()) / msPerDay
  );

  return { ...diff, nextBirthday, daysUntilBirthday };
}
