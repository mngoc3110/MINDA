#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(ScreenShare, "ScreenShare",
           CAP_PLUGIN_METHOD(setRoomInfo, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startShare, CAPPluginReturnPromise);
)
