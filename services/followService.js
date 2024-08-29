
const Follow = require('../models/follow'); // Asegúrate de que la ruta al modelo sea correcta

const getFollowersWithRelation = async (userId, loggedInUserId) => {

  try {
    // Encuentra los usuarios que sigue la persona cuyo perfil se está visitando
    const followRecords = await Follow.find({ user: userId }).populate('followed', 'name surname');

    // Mapea los resultados para incluir si el usuario logueado también los sigue
    const followersWithFollowing = await Promise.all(followRecords.map(async (follow) => {
      const isFollowing = await Follow.exists({ user: loggedInUserId, followed: follow.followed._id });

      return {
        user: follow.followed, // Información del usuario seguido por la persona cuyo perfil se está visitando
        isFollowing: !!isFollowing, // Indica si el usuario logueado (Juana) también sigue a esta persona
      };
    }));

    return followersWithFollowing;
  } catch (error) {
    console.error('Error al obtener los seguidores y relaciones:', error);
    throw new Error('Error al obtener los seguidores y relaciones');
  }
}

const followThisUser = async (identityUserId, profileUserId) => {

}  

  module.exports = {
    getFollowersWithRelation,
    followThisUser

}