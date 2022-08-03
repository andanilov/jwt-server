// DTO - Date transfer Object
module.exports = class UserDto {
  email;
  name;
  isactivated;
  created;
  access;

  constructor({ email, isactivated, name, created, access }) {
    this.email = email;
    this.name = name;
    this.isactivated = isactivated;
    this.created = created;
    this.access = access;
  }
}