const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    holidays: {
        enabled: {
            type: Boolean,
            default: true
        },
        preferences: {
            ramadan: {
                type: Boolean,
                default: true
            },
            christmas: {
                type: Boolean,
                default: true
            },
            newYear: {
                type: Boolean,
                default: true
            },
            eid: {
                type: Boolean,
                default: true
            }
        }
    },
    sports: {
        enabled: {
            type: Boolean,
            default: true
        },
        preferences: {
            football: {
                type: Boolean,
                default: true
            },
            basketball: {
                type: Boolean,
                default: true
            },
            baseball: {
                type: Boolean,
                default: true
            },
            soccer: {
                type: Boolean,
                default: true
            }
        },
        favoriteTeams: [{
            type: String
        }]
    },
    religious: {
        enabled: {
            type: Boolean,
            default: true
        },
        preferences: {
            prayerTimes: {
                type: Boolean,
                default: true
            },
            halalRestaurants: {
                type: Boolean,
                default: true
            },
            charityOpportunities: {
                type: Boolean,
                default: true
            }
        }
    },
    promos: {
        enabled: {
            type: Boolean,
            default: true
        },
        preferences: {
            restaurants: {
                type: Boolean,
                default: true
            },
            rides: {
                type: Boolean,
                default: true
            },
            events: {
                type: Boolean,
                default: true
            }
        }
    },
    notificationMethods: {
        push: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        }
    },
    quietHours: {
        enabled: {
            type: Boolean,
            default: false
        },
        start: {
            type: String,
            default: '22:00'  // 24-hour format
        },
        end: {
            type: String,
            default: '07:00'  // 24-hour format
        }
    },
    location: {
        enabled: {
            type: Boolean,
            default: true
        },
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create a 2dsphere index for location-based queries
notificationPreferenceSchema.index({ 'location.coordinates': '2dsphere' });

// Pre-save middleware to update lastUpdated
notificationPreferenceSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Method to check if notifications should be sent based on quiet hours
notificationPreferenceSchema.methods.shouldSendNotification = function() {
    if (!this.quietHours.enabled) return true;

    const now = new Date();
    const currentTime = now.getHours() + ':' + now.getMinutes();
    const start = this.quietHours.start;
    const end = this.quietHours.end;

    // Handle cases where quiet hours span across midnight
    if (start > end) {
        return !(currentTime >= start || currentTime < end);
    }
    return !(currentTime >= start && currentTime < end);
};

// Method to get active notification methods
notificationPreferenceSchema.methods.getActiveNotificationMethods = function() {
    return Object.entries(this.notificationMethods)
        .filter(([_, enabled]) => enabled)
        .map(([method]) => method);
};

const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);

module.exports = NotificationPreference; 