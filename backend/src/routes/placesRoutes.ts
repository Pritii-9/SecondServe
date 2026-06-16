import { Router, type Request, type Response, type NextFunction } from "express";
import { fetchPuneShops } from "../services/shopsService.js";

export function placesRouter() {
  const router = Router();

  router.get("/pune", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = typeof req.query.q === "string" ? req.query.q : undefined;
      const places = await fetchPuneShops(query);
      return res.json({ places });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
