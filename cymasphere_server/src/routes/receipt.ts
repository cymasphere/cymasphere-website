import { Router } from "oak";
import { verifyJwt } from "../middleware/authMiddleware.ts";

const router = new Router({ prefix: "/api/receipt" });

// In-memory receipt store (replace with a database in production)
interface Receipt {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: Date;
}

const receipts: Map<string, Receipt> = new Map();

// Get all receipts for a user
router.get("/", verifyJwt, (ctx) => {
  try {
    const userId = ctx.state.user.sub;

    // Filter receipts by user ID
    const userReceipts = Array.from(receipts.values()).filter(
      (receipt) => receipt.userId === userId
    );

    ctx.response.status = 200;
    ctx.response.body = { receipts: userReceipts };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Get a receipt by ID
router.get("/:id", verifyJwt, (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const id = ctx.params.id;

    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "ID is required" };
      return;
    }

    const receipt = receipts.get(id);

    if (!receipt) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Receipt not found" };
      return;
    }

    // Check if user owns the receipt
    if (receipt.userId !== userId) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { receipt };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

export default router;
