export const formatDateFriendly = (date = new Date()) =>
	date.getDate() +
	' ' +
	date.toLocaleString('en-GB', { month: 'short' }) +
	' ' +
	date.getFullYear();
