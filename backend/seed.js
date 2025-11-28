const committees = [
  { code: 'EP', name: 'European Parliament', flag: '🇪🇺', chairs: 2, delegates: 2 },
  { code: 'UNSC', name: 'Security Council', flag: '🛡️', chairs: 2, delegates: 2 }
];

function makeUsers() {
  const users = [];
  committees.forEach((committee) => {
    for (let i = 1; i <= committee.chairs; i += 1) {
      users.push({
        username: `${committee.code}-chair-${i}`,
        password: `${committee.code.toLowerCase()}-chair${i}-day1`,
        role: 'chair',
        committee_code: committee.code,
        delegation: `${committee.name} Dais`,
        flag: committee.flag
      });
    }
    for (let j = 1; j <= committee.delegates; j += 1) {
      users.push({
        username: `${committee.code}-delegate-${j}`,
        password: `${committee.code.toLowerCase()}-del${j}-day1`,
        role: 'delegate',
        committee_code: committee.code,
        delegation: `${committee.name} Seat ${j}`,
        flag: committee.flag
      });
    }
  });
  return users;
}

module.exports = makeUsers();

