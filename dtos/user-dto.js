// DTO - Date transfer Object
module.exports = class UserDto {
  email;
  name;
  isActivated;

  constructor({ email, isActivated, name }) {
    this.email = email;
    this.name = name;
    this.isActivated = isActivated;
  }
}