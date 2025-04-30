import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

// Mock Supabase client for compatibility with existing code
export const supabaseClient = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      console.log("Mock Supabase: signInWithPassword called");
      return {
        data: null,
        error: new Error("Supabase is not available in local mode")
      };
    },
    getUser: async (token) => {
      console.log("Mock Supabase: getUser called");
      return {
        data: null,
        error: new Error("Supabase is not available in local mode")
      };
    }
  }
};

// Mock Supabase admin client for compatibility with existing code
export const supabaseAdmin = {
  auth: {
    admin: {
      createUser: async (userData) => {
        console.log("Mock Supabase Admin: createUser called");
        return {
          data: null,
          error: new Error("Supabase is not available in local mode")
        };
      },
      listUsers: async () => {
        console.log("Mock Supabase Admin: listUsers called");
        return {
          data: null,
          error: new Error("Supabase is not available in local mode")
        };
      },
      deleteUser: async (userId) => {
        console.log("Mock Supabase Admin: deleteUser called");
        return {
          data: null,
          error: new Error("Supabase is not available in local mode")
        };
      },
      updateUserById: async (userId, userData) => {
        console.log("Mock Supabase Admin: updateUserById called");
        return {
          data: null,
          error: new Error("Supabase is not available in local mode")
        };
      }
    }
  }
};

