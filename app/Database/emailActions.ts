"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { UsersTable } from "./schema";
import { eq } from "drizzle-orm";

// Initialize database connection
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

// Input validation functions
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const isValidSourcePage = (sourcePage: string): sourcePage is 'PredictionPot' | 'AI' | 'PrivatePot' | 'CreatePot' => {
  return ['PredictionPot', 'AI', 'PrivatePot', 'CreatePot'].includes(sourcePage);
};

const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>"\\']/g, '');
};

/**
 * Check if a user's email has already been collected
 */
export async function checkEmailExists(walletAddress: string): Promise<boolean> {
  try {
    // Input validation
    if (!walletAddress || typeof walletAddress !== 'string') {
      console.error("Invalid wallet address input");
      return false;
    }

    const sanitizedAddress = sanitizeString(walletAddress);
    
    // Validate Ethereum address format
    if (!isValidEthereumAddress(sanitizedAddress)) {
      console.error("Invalid Ethereum address format");
      return false;
    }

    const user = await db.select().from(UsersTable)
      .where(eq(UsersTable.walletAddress, sanitizedAddress.toLowerCase()))
      .limit(1);
    
    // Check if user exists AND has an email
    return user.length > 0 && user[0].email !== null && user[0].email !== undefined;
  } catch (error) {
    console.error("Error checking email existence:", error);
    return false; // Default to false so modal shows on error
  }
}

/**
 * Get user's email address by wallet address
 */
export async function getUserEmail(walletAddress: string): Promise<string | null> {
  try {
    // Input validation
    if (!walletAddress || typeof walletAddress !== 'string') {
      console.error("Invalid wallet address input");
      return null;
    }

    const sanitizedAddress = sanitizeString(walletAddress);
    
    // Validate Ethereum address format
    if (!isValidEthereumAddress(sanitizedAddress)) {
      console.error("Invalid Ethereum address format");
      return null;
    }

    const user = await db.select().from(UsersTable)
      .where(eq(UsersTable.walletAddress, sanitizedAddress.toLowerCase()))
      .limit(1);
    
    return user.length > 0 ? user[0].email : null;
  } catch (error) {
    console.error("Error getting user email:", error);
    return null;
  }
}

/**
 * Save user's email address
 */
export async function saveUserEmail(
  walletAddress: string, 
  email: string, 
  sourcePage: 'PredictionPot' | 'AI' | 'PrivatePot' | 'CreatePot'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Input validation
    if (!walletAddress || typeof walletAddress !== 'string') {
      return { success: false, error: "Invalid wallet address" };
    }

    if (!email || typeof email !== 'string') {
      return { success: false, error: "Invalid email address" };
    }

    if (!sourcePage || typeof sourcePage !== 'string') {
      return { success: false, error: "Invalid source page" };
    }

    // Sanitize inputs
    const sanitizedAddress = sanitizeString(walletAddress);
    const sanitizedEmail = sanitizeString(email);

    // Validate Ethereum address format
    if (!isValidEthereumAddress(sanitizedAddress)) {
      return { success: false, error: "Invalid Ethereum address format" };
    }

    // Validate email format and length
    if (!isValidEmail(sanitizedEmail)) {
      return { success: false, error: "Invalid email format" };
    }

    // Validate source page
    if (!isValidSourcePage(sourcePage)) {
      return { success: false, error: "Invalid source page" };
    }

    // Check if user already exists
    const existingUser = await db.select().from(UsersTable)
      .where(eq(UsersTable.walletAddress, sanitizedAddress.toLowerCase()))
      .limit(1);
    
    if (existingUser.length > 0) {
      // User exists, update their email if they don't have one
      if (!existingUser[0].email) {
        await db.update(UsersTable)
          .set({ 
            email: sanitizedEmail.toLowerCase().trim(),
            sourcePage: sourcePage, // Update source page too
          })
          .where(eq(UsersTable.walletAddress, sanitizedAddress.toLowerCase()));
      }
      return { success: true }; // Already exists or updated, treat as success
    }

    // Insert with validated and sanitized data
    await db.insert(UsersTable).values({
      walletAddress: sanitizedAddress.toLowerCase(),
      email: sanitizedEmail.toLowerCase().trim(),
      sourcePage,
      collectedAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error saving user email:", error);
    
    // Handle unique constraint violations gracefully
    if (error?.code === '23505') { // PostgreSQL unique violation
      return { success: true }; // Email already exists, treat as success
    }
    
    return { 
      success: false, 
      error: "Failed to save email address" 
    };
  }
}

/**
 * Get user's full information (for admin purposes)
 */
export async function getUserInfo(walletAddress: string) {
  try {
    // Input validation
    if (!walletAddress || typeof walletAddress !== 'string') {
      console.error("Invalid wallet address input");
      return null;
    }

    const sanitizedAddress = sanitizeString(walletAddress);
    
    // Validate Ethereum address format
    if (!isValidEthereumAddress(sanitizedAddress)) {
      console.error("Invalid Ethereum address format");
      return null;
    }

    const user = await db.select().from(UsersTable)
      .where(eq(UsersTable.walletAddress, sanitizedAddress.toLowerCase()))
      .limit(1);
    
    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}

/**
 * Get email collection stats (for admin purposes)
 */
export async function getEmailStats() {
  try {
    const total = await db.select().from(UsersTable);
    // Only count users with emails
    const usersWithEmails = total.filter(u => u.email !== null && u.email !== undefined);
    
    const stats = {
      total: usersWithEmails.length,
      totalUsers: total.length, // Total users (including those with just imageUrl)
      bySource: {
        PredictionPot: usersWithEmails.filter(u => u.sourcePage === 'PredictionPot').length,
        AI: usersWithEmails.filter(u => u.sourcePage === 'AI').length,
        PrivatePot: usersWithEmails.filter(u => u.sourcePage === 'PrivatePot').length,
        CreatePot: usersWithEmails.filter(u => u.sourcePage === 'CreatePot').length,
        Profile: usersWithEmails.filter(u => u.sourcePage === 'Profile').length,
      }
    };
    
    return stats;
  } catch (error) {
    console.error("Error getting email stats:", error);
    return {
      total: 0,
      totalUsers: 0,
      bySource: { PredictionPot: 0, AI: 0, PrivatePot: 0, CreatePot: 0, Profile: 0 }
    };
  }
}