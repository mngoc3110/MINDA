/**
 * SCORM 1.2 API Wrapper
 * Handles communication between the lesson and the LMS
 */

var ScormAPI = (function () {
  var api = null;
  var initialized = false;
  var completed = false;

  // Find the SCORM API in parent/opener windows
  function findAPI(win) {
    var attempts = 0;
    while (win && !win.API && attempts < 10) {
      if (win.parent && win.parent !== win) {
        win = win.parent;
      } else if (win.opener) {
        win = win.opener;
      } else {
        break;
      }
      attempts++;
    }
    return win ? win.API || null : null;
  }

  function getAPI() {
    if (api) return api;
    api = findAPI(window);
    if (!api && window.opener) {
      api = findAPI(window.opener);
    }
    if (!api && window.parent) {
      api = findAPI(window.parent);
    }
    return api;
  }

  return {
    /**
     * Initialize connection with the LMS
     */
    init: function () {
      var lmsAPI = getAPI();
      if (lmsAPI) {
        var result = lmsAPI.LMSInitialize("");
        if (result === "true" || result === true) {
          initialized = true;
          // Set initial status
          lmsAPI.LMSSetValue("cmi.core.lesson_status", "incomplete");
          lmsAPI.LMSSetValue("cmi.core.score.min", "0");
          lmsAPI.LMSSetValue("cmi.core.score.max", "100");
          lmsAPI.LMSCommit("");
          console.log("[SCORM] Initialized successfully");
        } else {
          console.warn("[SCORM] LMSInitialize failed");
        }
      } else {
        console.log("[SCORM] No LMS API found — running in standalone mode");
      }
      return initialized;
    },

    /**
     * Set lesson status
     * @param {string} status - "incomplete", "completed", "passed", "failed"
     */
    setStatus: function (status) {
      var lmsAPI = getAPI();
      if (lmsAPI && initialized) {
        lmsAPI.LMSSetValue("cmi.core.lesson_status", status);
        lmsAPI.LMSCommit("");
        console.log("[SCORM] Status set to: " + status);
      }
    },

    /**
     * Set score
     * @param {number} score - Score value (0-100)
     */
    setScore: function (score) {
      var lmsAPI = getAPI();
      if (lmsAPI && initialized) {
        lmsAPI.LMSSetValue("cmi.core.score.raw", String(score));
        lmsAPI.LMSCommit("");
        console.log("[SCORM] Score set to: " + score);
      }
    },

    /**
     * Save bookmark (lesson location)
     * @param {string} location - Current scene/section identifier
     */
    setLocation: function (location) {
      var lmsAPI = getAPI();
      if (lmsAPI && initialized) {
        lmsAPI.LMSSetValue("cmi.core.lesson_location", location);
        lmsAPI.LMSCommit("");
      }
    },

    /**
     * Get saved bookmark
     * @returns {string} Last saved location
     */
    getLocation: function () {
      var lmsAPI = getAPI();
      if (lmsAPI && initialized) {
        return lmsAPI.LMSGetValue("cmi.core.lesson_location");
      }
      return "";
    },

    /**
     * Save suspend data (progress state)
     * @param {string} data - JSON string of progress data
     */
    setSuspendData: function (data) {
      var lmsAPI = getAPI();
      if (lmsAPI && initialized) {
        lmsAPI.LMSSetValue("cmi.suspend_data", data);
        lmsAPI.LMSCommit("");
      }
    },

    /**
     * Get suspend data
     * @returns {string} Previously saved data
     */
    getSuspendData: function () {
      var lmsAPI = getAPI();
      if (lmsAPI && initialized) {
        return lmsAPI.LMSGetValue("cmi.suspend_data");
      }
      return "";
    },

    /**
     * Mark lesson as complete with score
     * @param {number} score - Final score (0-100)
     */
    complete: function (score) {
      if (completed) return;
      completed = true;
      this.setScore(score);
      this.setStatus(score >= 80 ? "passed" : "completed");
    },

    /**
     * Finish/terminate the SCORM session
     */
    finish: function () {
      var lmsAPI = getAPI();
      if (lmsAPI && initialized) {
        lmsAPI.LMSFinish("");
        console.log("[SCORM] Session finished");
      }
    },

    /**
     * Check if running inside an LMS
     */
    isAvailable: function () {
      return getAPI() !== null;
    },
  };
})();
