"use server";

import { createPrivatePot, getPotDetails, makePrediction, addParticipant } from "./actions2";

/**
 * Test function to verify private pot database functionality
 * Run this to test the new database setup
 */
export async function testPrivatePotDatabase() {
  console.log("🧪 Testing Private Pot Database Setup...");

  try {
    // Test contract address from your example
    const testContractAddress = "0x2d5c717639cbb794da707295febbdfd0b5732b32";
    const testCreatorAddress = "0x1234567890123456789012345678901234567890";
    const testUserAddress = "0x9876543210987654321098765432109876543210";

    console.log("1. Creating private pot...");
    const createResult = await createPrivatePot(
      testContractAddress,
      testCreatorAddress,
      "Bitcoin December Test",
      "Will BTC be above $95k on December 15th?"
    );
    
    if (createResult.success) {
      console.log("✅ Pot created successfully:", createResult.pot);
    } else {
      console.log("❌ Failed to create pot:", createResult.error);
      return;
    }

    console.log("2. Getting pot details...");
    const potDetails = await getPotDetails(testContractAddress);
    if (potDetails) {
      console.log("✅ Pot details retrieved:", potDetails);
    } else {
      console.log("❌ Failed to get pot details");
      return;
    }

    console.log("3. Adding participant...");
    const participantResult = await addParticipant(
      testContractAddress,
      testUserAddress,
      50000, // 0.05 USDC
      "0xtest_transaction_hash"
    );
    
    if (participantResult.success) {
      console.log("✅ Participant added successfully");
    } else {
      console.log("❌ Failed to add participant:", participantResult.error);
    }

    console.log("4. Making prediction...");
    const predictionResult = await makePrediction(
      testContractAddress,
      testUserAddress,
      "positive",
      "2024-12-15"
    );

    if (predictionResult.success) {
      console.log("✅ Prediction made successfully");
    } else {
      console.log("❌ Failed to make prediction:", predictionResult.error);
    }

    console.log("🎉 All tests completed successfully!");
    return { success: true, message: "Database setup is working correctly" };

  } catch (error) {
    console.error("💥 Test failed with error:", error);
    return { success: false, error: "Database test failed" };
  }
}

// Uncomment to run test (be careful not to run in production!)
// testPrivatePotDatabase().then(result => console.log("Test result:", result));