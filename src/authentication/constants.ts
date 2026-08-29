export const INPUT_OTP_COUNT = 6;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = String.raw`[A-Za-z0-9](?!.*[_.\-]{2})[A-Za-z0-9_.\-]{${USERNAME_MIN_LENGTH - 1},${USERNAME_MAX_LENGTH - 1}}`;
export const USERNAME_REGEX = new RegExp(`^${USERNAME_PATTERN}$`);

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_PATTERN = `(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{${PASSWORD_MIN_LENGTH},${PASSWORD_MAX_LENGTH}}`;
export const PASSWORD_REGEX = new RegExp(`^${PASSWORD_PATTERN}$`);
