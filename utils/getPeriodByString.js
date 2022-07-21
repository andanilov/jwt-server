// 5m -> 5 * 60 * 1000
const periodRules = {
	ms: 1000,
	get s() { return this.ms * 60 },
	get m() { return this.s * 60 },
	get h() { return this.m * 60 },
	get d() { return this.h * 24 },
}

module.exports = function (str) {
	const num = +str.match(/\d+/)[0];
	const timeType = str.match(/[A-Za-z]+/)[0];

	return (periodRules[timeType] && num) ? num * periodRules[timeType] : str;
}
