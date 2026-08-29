export const INPUT_OTP_COUNT = 6;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_PATTERN = `(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{${PASSWORD_MIN_LENGTH},${PASSWORD_MAX_LENGTH}}`;
export const PASSWORD_REGEX = new RegExp(`^${PASSWORD_PATTERN}$`);
