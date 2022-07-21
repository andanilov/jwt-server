// DTO - Date transfer Object
module.exports = class UserDto {
  email;
  name;
  isActivated;

  constructor({ email, isactivated, name }) {
    this.email = email;
    this.name = name;
    this.isActivated = isactivated;
  }
}