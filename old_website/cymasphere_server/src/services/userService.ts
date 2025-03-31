import { User } from "../models/user.ts";
import { deleteStripeCustomer } from "./stripeService.ts";

// Get user by ID
export async function getUser(userId: string): Promise<Omit<User, "password">> {
  try {
    const user = await User.findById(userId)
      .select("+username +email +name +description +tutorials")
      .exec();

    if (!user) {
      throw new Error("User not found");
    }

    // Convert to plain object and remove password
    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;

    return userWithoutPassword;
  } catch (error: any) {
    throw new Error(`Error getting user: ${error.message}`);
  }
}

// Get user profile (includes subscription status)
export async function getUserProfile(userId: string): Promise<any> {
  try {
    const user = await User.findById(userId)
      .select("+username +email +name +description +tutorials")
      .exec();

    if (!user) {
      throw new Error("User not found");
    }

    // Convert to plain object and remove password
    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;

    // Get subscription status if user has a customer ID
    let subscriptionStatus = { status: "inactive" };
    if (user.custId) {
      try {
        // Import dynamically to avoid circular dependency
        const { getSubscriptionStatus } = await import("./stripeService.ts");
        subscriptionStatus = await getSubscriptionStatus(user.custId);
      } catch (error: any) {
        console.error("Error getting subscription status:", error);
      }
    }

    return {
      ...userWithoutPassword,
      subscription: subscriptionStatus,
    };
  } catch (error: any) {
    throw new Error(`Error getting user profile: ${error.message}`);
  }
}

// Update user
export async function updateUser(
  userId: string,
  updateData: any
): Promise<Omit<User, "password">> {
  try {
    // Prevent updating sensitive fields
    const { password, email, emailVerified, custId, ...safeUpdateData } =
      updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: safeUpdateData },
      { new: true }
    )
      .select("+username +email +name +description +tutorials")
      .exec();

    if (!user) {
      throw new Error("User not found");
    }

    // Convert to plain object and remove password
    const userObj = user.toObject();
    const { password: userPassword, ...userWithoutPassword } = userObj;

    return userWithoutPassword;
  } catch (error: any) {
    throw new Error(`Error updating user: ${error.message}`);
  }
}

// Delete user
export async function deleteUser(userId: string): Promise<void> {
  try {
    const user = await User.findById(userId).select("+custId").exec();

    if (!user) {
      throw new Error("User not found");
    }

    // Delete user's Stripe customer if exists
    if (user.custId) {
      await deleteStripeCustomer(user.custId);
    }

    // Delete user
    await User.findByIdAndDelete(userId).exec();
  } catch (error: any) {
    throw new Error(`Error deleting user: ${error.message}`);
  }
}
