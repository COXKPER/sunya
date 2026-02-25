const settings = require('./settings.json');

module.exports = function isOwner(senderNumber) {
  const cleanNumber = senderNumber.replace(/[^0-9]/g, '');

  const owners = settings.owner.map(v =>
    v.replace(/[^0-9]/g, '')
  );

  return owners.includes(cleanNumber);
};