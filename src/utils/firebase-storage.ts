/**
 * Firebase Storage Utility
 *
 * Uploads screenshots to Firebase Storage and returns public URLs
 * This prevents MCP response size limits and Claude crashes
 */

import admin from 'firebase-admin';

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    // Check if Firebase credentials are provided
    const firebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (firebaseConfig) {
      // Option 1: Service account JSON (recommended)
      const serviceAccount = JSON.parse(firebaseConfig);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
      });
      console.log('🔥 Firebase initialized with service account');
    } else {
      // Option 2: Simple project ID + application default credentials
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

      if (projectId && storageBucket) {
        admin.initializeApp({
          projectId,
          storageBucket
        });
        console.log('🔥 Firebase initialized with project credentials');
      } else {
        console.warn('⚠️  Firebase not configured - screenshots will use base64 (may crash Claude!)');
        console.warn('   Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID + FIREBASE_STORAGE_BUCKET');
        return;
      }
    }

    firebaseInitialized = true;
  } catch (error: any) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.warn('   Screenshots will fall back to base64 (may crash Claude!)');
  }
}

/**
 * Upload screenshot to Firebase Storage
 * Returns public URL to the screenshot
 */
export async function uploadScreenshot(
  screenshotBuffer: Buffer,
  sessionId: string,
  action: string
): Promise<string | null> {
  if (!firebaseInitialized) {
    console.warn('⚠️  Firebase not initialized - cannot upload screenshot');
    return null;
  }

  try {
    const bucket = admin.storage().bucket();
    const timestamp = Date.now();
    const filename = `screenshots/${sessionId}/${timestamp}-${action.replace(/[^a-z0-9]/gi, '-')}.png`;
    const file = bucket.file(filename);

    // Upload with public read access and 1 hour expiration
    await file.save(screenshotBuffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          sessionId,
          action,
          uploadedAt: new Date().toISOString()
        }
      },
      public: true
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    console.log(`📸 Screenshot uploaded: ${publicUrl}`);

    // Schedule deletion after 1 hour (optional - saves storage costs)
    setTimeout(async () => {
      try {
        await file.delete();
        console.log(`🗑️  Screenshot deleted: ${filename}`);
      } catch (err) {
        // Ignore deletion errors
      }
    }, 3600000); // 1 hour

    return publicUrl;
  } catch (error: any) {
    console.error(`❌ Failed to upload screenshot to Firebase:`, error.message);
    return null;
  }
}

/**
 * Check if Firebase is available
 */
export function isFirebaseAvailable(): boolean {
  return firebaseInitialized;
}
