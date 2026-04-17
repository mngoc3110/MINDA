#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Register the ScreenShare plugin with Capacitor.
// This allows the registerPlugin("ScreenShare") call in JS to find the native Swift class.
CAP_PLUGIN(ScreenSharePlugin, "ScreenShare",
    CAP_PLUGIN_METHOD(startShare, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopShare, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setRoomInfo, CAPPluginReturnPromise);
)
