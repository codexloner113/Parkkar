import * as favoriteRepo from '../repositories/favorite.repository.js';
import * as parkingRepo from '../repositories/parking.repository.js';
import { sendSuccess } from '../utils/response.js';
import { Errors } from '../utils/errors.js';

export async function add(req, res, next) {
  try {
    const location = await parkingRepo.findLocationById(req.params.parkingId);
    if (!location) throw Errors.notFound('Parking location not found.');
    const favorite = await favoriteRepo.addFavorite(req.user.id, req.params.parkingId);
    return sendSuccess(res, { message: 'Added to favorites.', data: favorite, status: 201 });
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const favorites = await favoriteRepo.listFavoritesForUser(req.user.id);
    return sendSuccess(res, { message: 'Favorites retrieved.', data: favorites });
  } catch (err) {
    return next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const removed = await favoriteRepo.removeFavorite(req.user.id, req.params.parkingId);
    if (!removed) throw Errors.notFound('Favorite not found.');
    return sendSuccess(res, { message: 'Removed from favorites.', data: null });
  } catch (err) {
    return next(err);
  }
}
