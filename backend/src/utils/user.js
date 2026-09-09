// Prisma returns every scalar column by default, which includes the bcrypt
// `password` hash. Use these helpers anywhere a User is sent to a client.

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  adId: true,
  createdAt: true,
};

function toPublicUser(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

module.exports = { publicUserSelect, toPublicUser };
