 // issenderowner.js
const settings = require('./settings.json');

module.exports = function(senderNumber) {
  const owners = settings.owner.map(v => v.replace(/[^0-9]/g, ''));
  const isOwner = owners.includes(senderNumber);

  return {
    then: function (fn) {
      if (isOwner) fn();
      return this;
    },
    else: function (fn) {
      if (!isOwner) fn();
      return this;
    }
  };
};
