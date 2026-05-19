/**
 * Face API Utilities
 * Helper functions for face recognition with face-api.js
 */

// Configuration
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const STORAGE_KEY = 'registeredFaces';

/**
 * Load all required models
 * Uses: TinyFaceDetector, faceLandmark68Net, faceRecognitionNet
 */
async function loadModels() {
    console.log('Loading models...');
    
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    
    console.log('All models loaded successfully!');
    return true;
}

/**
 * Detect face and get descriptor from video element
 * @param {HTMLVideoElement} video - Video element
 * @returns {Object|null} - Detection result with descriptor or null
 */
async function detectFace(video) {
    const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
    
    return detection || null;
}

/**
 * Convert Float32Array to regular Array
 * @param {Float32Array} descriptor - Face descriptor
 * @returns {Array} - Regular array
 */
function descriptorToArray(descriptor) {
    return Array.from(descriptor);
}

/**
 * Convert regular Array back to Float32Array
 * @param {Array} descriptorArray - Regular array
 * @returns {Float32Array} - Float32Array
 */
function arrayToDescriptor(descriptorArray) {
    return new Float32Array(descriptorArray);
}

/**
 * Save face data to localStorage
 * Appends new data without deleting old data
 * @param {string} name - Person's name
 * @param {Float32Array} descriptor - Face descriptor
 */
function saveFaceToStorage(name, descriptor) {
    // Get existing faces
    const existingFaces = getFacesFromStorage();
    
    // Create new face object
    const newFace = {
        name: name,
        descriptor: descriptorToArray(descriptor), // Convert Float32Array to Array
        createdAt: new Date().toISOString()
    };
    
    // Add new face to existing array
    existingFaces.push(newFace);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingFaces));
    
    console.log('Face saved! Total faces:', existingFaces.length);
    return existingFaces.length;
}

/**
 * Get all faces from localStorage
 * @returns {Array} - Array of face objects
 */
function getFacesFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored faces:', e);
            return [];
        }
    }
    return [];
}

/**
 * Create LabeledFaceDescriptors from stored faces
 * @returns {faceapi.LabeledFaceDescriptors[]} - Array of labeled descriptors
 */
function createLabeledDescriptors() {
    const faces = getFacesFromStorage();
    
    if (faces.length === 0) {
        return [];
    }
    
    // Group faces by name (in case same person has multiple descriptors)
    const groupedFaces = {};
    
    faces.forEach(face => {
        if (!groupedFaces[face.name]) {
            groupedFaces[face.name] = [];
        }
        groupedFaces[face.name].push(arrayToDescriptor(face.descriptor));
    });
    
    // Create LabeledFaceDescriptors
    const labeledDescriptors = Object.keys(groupedFaces).map(name => {
        return new faceapi.LabeledFaceDescriptors(
            name,
            groupedFaces[name]
        );
    });
    
    return labeledDescriptors;
}

/**
 * Create FaceMatcher for face recognition
 * @param {number} distanceThreshold - Maximum distance for match (default: 0.6)
 * @returns {faceapi.FaceMatcher|null} - FaceMatcher or null if no faces
 */
function createFaceMatcher(distanceThreshold = 0.6) {
    const labeledDescriptors = createLabeledDescriptors();
    
    if (labeledDescriptors.length === 0) {
        console.log('No faces registered yet');
        return null;
    }
    
    return new faceapi.FaceMatcher(labeledDescriptors, distanceThreshold);
}

/**
 * Recognize face from detection
 * @param {Object} detection - Face detection result
 * @param {faceapi.FaceMatcher} faceMatcher - FaceMatcher instance
 * @returns {Object} - Recognition result with name and distance
 */
function recognizeFace(detection, faceMatcher) {
    if (!faceMatcher || !detection) {
        return { name: 'unknown', distance: 1 };
    }
    
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
    
    return {
        name: bestMatch.label,
        distance: bestMatch.distance,
        isKnown: bestMatch.label !== 'unknown'
    };
}

/**
 * Delete a face from storage by index
 * @param {number} index - Index of face to delete
 */
function deleteFace(index) {
    const faces = getFacesFromStorage();
    
    if (index >= 0 && index < faces.length) {
        const deletedName = faces[index].name;
        faces.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(faces));
        console.log(`Deleted face: ${deletedName}`);
        return true;
    }
    
    return false;
}

/**
 * Clear all registered faces
 */
function clearAllFaces() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('All faces cleared');
}

/**
 * Get number of registered faces
 * @returns {number} - Number of faces
 */
function getFaceCount() {
    return getFacesFromStorage().length;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadModels,
        detectFace,
        descriptorToArray,
        arrayToDescriptor,
        saveFaceToStorage,
        getFacesFromStorage,
        createLabeledDescriptors,
        createFaceMatcher,
        recognizeFace,
        deleteFace,
        clearAllFaces,
        getFaceCount,
        STORAGE_KEY
    };
}

