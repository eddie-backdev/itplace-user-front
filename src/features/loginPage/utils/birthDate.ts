const DIGIT_ONLY = /\D/g;

export const formatBirthDateInput = (value: string) => {
  const digits = value.replace(DIGIT_ONLY, '').slice(0, 8);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);

  return [year, month, day].filter(Boolean).join('.');
};

export const birthDateInputToApiDate = (value: string) => {
  const digits = value.replace(DIGIT_ONLY, '').slice(0, 8);

  if (digits.length !== 8) {
    return value;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

export const isCompleteBirthDateInput = (value: string) =>
  value.replace(DIGIT_ONLY, '').length === 8;

export const parseBirthDateInput = (value: string) => {
  if (!isCompleteBirthDateInput(value)) {
    return null;
  }

  const normalizedValue = birthDateInputToApiDate(value);
  const parsedDate = new Date(`${normalizedValue}T00:00:00`);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const formatDateToBirthInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
};
