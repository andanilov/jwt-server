// DTO - Date transfer Object
module.exports = class UserDto {
  email;
  name;
  isactivated;

  constructor({ email, isactivated, name }) {
    this.email = email;
    this.name = name;
    this.isactivated = isactivated;
  }
}