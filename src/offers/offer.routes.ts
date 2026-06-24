import { FastifyInstance } from "fastify";
import { acceptAssignmentOffer } from "./offer.service.js";
import { acceptOfferJsonSchema, acceptOfferSchema } from "./offer.schema.js";
import { findAssignmentOfferById } from "./offer.repository.js";

export async function offerRoutes(app: FastifyInstance) {
  app.get("/offers/:offerId", async (request) => {
    const { offerId } = request.params as { offerId: string };
    const offer = await findAssignmentOfferById(offerId);
    if (!offer) {
      throw app.httpErrors.notFound("Offer not found");
    }
    return {
      id: offer.id,
      status: offer.status,
      expiresAt: offer.expiresAt,
      appointment: {
        id: offer.appointment.id,
        clientName: offer.appointment.clientName,
        facilityName: offer.appointment.facilityName,
        address: offer.appointment.address,
        startTime: offer.appointment.startTime,
        payAmountCents: offer.appointment.payAmountCents,
      },
      interpreter: {
        id: offer.interpreter.id,
        name: offer.interpreter.name,
      },
    };
  });

  app.post("/offers/:offerId/accept", {
    schema: { body: acceptOfferJsonSchema },
  }, async (request) => {
    const { offerId } = request.params as { offerId: string };
    const { token } = acceptOfferSchema.parse(request.body);
    return acceptAssignmentOffer(offerId, token);
  });
}
