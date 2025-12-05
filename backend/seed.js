const COMMITTEES = [
  { code: 'EP', name: 'European Parliament', flag: '🇪🇺', chairs: 3, delegates: 25 },
  { code: 'USS', name: 'United States Senate', flag: '🇺🇸', chairs: 3, delegates: 30 },
  { code: 'ECOSOC', name: 'Economic and Social Council', flag: '🇺🇳', chairs: 2, delegates: 25 },
  { code: 'HSC', name: 'Historical Security Council', flag: '🕰️', chairs: 4, delegates: 35 },
  { code: 'ICJ', name: 'International Court of Justice', flag: '⚖️', chairs: 3, delegates: 15 },
  { code: 'INTERPOL', name: 'International Criminal Police Organization', flag: '🛂', chairs: 3, delegates: 25 },
  { code: 'UNODC', name: 'UN Office on Drugs and Crime', flag: '💊', chairs: 2, delegates: 25 },
  { code: 'CSTD', name: 'Commission on Science & Technology for Development', flag: '🧪', chairs: 2, delegates: 25 },
  { code: 'UNSC', name: 'Security Council', flag: '🛡️', chairs: 2, delegates: 30 },
  { code: 'UNHRC', name: 'Human Rights Council', flag: '🕊️', chairs: 2, delegates: 30 },
  { code: 'DISEC', name: 'Disarmament and International Security Committee', flag: '🕊️', chairs: 2, delegates: 30 },
  { code: 'UNICEF', name: 'United Nations Children\'s Fund', flag: '👧', chairs: 2, delegates: 20 },
  { code: 'UNWOMEN', name: 'United Nations Entity for Gender Equality', flag: '♀️', chairs: 2, delegates: 30 },
  { code: 'WHO', name: 'World Health Organization', flag: '⚕️', chairs: 2, delegates: 30 },
  { code: 'UNEP', name: 'United Nations Environmental Programme', flag: '🌿', chairs: 2, delegates: 20 },
  { code: 'UNESCO', name: 'UN Educational, Scientific and Cultural Organization', flag: '🏛️', chairs: 2, delegates: 20 },
  { code: 'F1', name: 'Formula One Council', flag: '🏁', chairs: 2, delegates: 20 },
  { code: 'PRESS', name: 'Press Corps', flag: '📰', chairs: 2, delegates: 20 },
  { code: 'UNCSA', name: 'Commission on Superhuman Activities', flag: '🦸', chairs: 2, delegates: 20 },
  { code: 'FWC', name: 'Fantasy World Committee', flag: '🐉', chairs: 2, delegates: 30 }
];

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const pad = (num) => String(num).padStart(2, '0');

function makeUsers() {
  const users = [];
  COMMITTEES.forEach((committee) => {
    const slug = slugify(committee.code || committee.name);
    
    // Create chairs
    for (let i = 1; i <= committee.chairs; i += 1) {
      // Create separate users for day 1 and day 2
      users.push({
        username: `${slug}-chair${pad(i)}-day1`,
        password: `${slug}-chair${pad(i)}-day1`,
        role: 'chair',
        committee_code: committee.code,
        delegation: `${committee.code} Dais`,
        flag: committee.flag,
        credentials_day: 1
      });
      users.push({
        username: `${slug}-chair${pad(i)}-day2`,
        password: `${slug}-chair${pad(i)}-day2`,
        role: 'chair',
        committee_code: committee.code,
        delegation: `${committee.code} Dais`,
        flag: committee.flag,
        credentials_day: 2
      });
    }
    
    // Create delegates
    for (let j = 1; j <= committee.delegates; j += 1) {
      // Create separate users for day 1 and day 2
      users.push({
        username: `${slug}-del${pad(j)}-day1`,
        password: `${slug}-del${pad(j)}-day1`,
        role: 'delegate',
        committee_code: committee.code,
        delegation: `${committee.name} Seat ${pad(j)}`,
        flag: committee.flag,
        credentials_day: 1
      });
      users.push({
        username: `${slug}-del${pad(j)}-day2`,
        password: `${slug}-del${pad(j)}-day2`,
        role: 'delegate',
        committee_code: committee.code,
        delegation: `${committee.name} Seat ${pad(j)}`,
        flag: committee.flag,
        credentials_day: 2
      });
    }
  });
  
  // Create Parliamentarians (3 parliamentarians, separate for day 1 and day 2)
  for (let i = 1; i <= 3; i += 1) {
    users.push({
      username: `parliamentarian${pad(i)}-day1`,
      password: `parliamentarian${pad(i)}-day1`,
      role: 'parliamentarian',
      committee_code: 'GENERAL',
      delegation: `Parliamentarian ${i}`,
      flag: '🏛️',
      credentials_day: 1
    });
    users.push({
      username: `parliamentarian${pad(i)}-day2`,
      password: `parliamentarian${pad(i)}-day2`,
      role: 'parliamentarian',
      committee_code: 'GENERAL',
      delegation: `Parliamentarian ${i}`,
      flag: '🏛️',
      credentials_day: 2
    });
  }
  
  // Create Secretary General (1 sec gen, 1 deputy sec gen, separate for day 1 and day 2)
  users.push({
    username: 'secretary-general-day1',
    password: 'secretary-general-day1',
    role: 'secretary-general',
    committee_code: 'GENERAL',
    delegation: 'Secretary General',
    flag: '📋',
    credentials_day: 1
  });
  users.push({
    username: 'secretary-general-day2',
    password: 'secretary-general-day2',
    role: 'secretary-general',
    committee_code: 'GENERAL',
    delegation: 'Secretary General',
    flag: '📋',
    credentials_day: 2
  });
  users.push({
    username: 'deputy-secretary-general-day1',
    password: 'deputy-secretary-general-day1',
    role: 'secretary-general',
    committee_code: 'GENERAL',
    delegation: 'Deputy Secretary General',
    flag: '📋',
    credentials_day: 1
  });
  users.push({
    username: 'deputy-secretary-general-day2',
    password: 'deputy-secretary-general-day2',
    role: 'secretary-general',
    committee_code: 'GENERAL',
    delegation: 'Deputy Secretary General',
    flag: '📋',
    credentials_day: 2
  });
  
  return users;
}

module.exports = makeUsers();
