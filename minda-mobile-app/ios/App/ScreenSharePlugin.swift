import Foundation
import Capacitor
import ReplayKit

@objc(ScreenShare)
public class ScreenShare: CAPPlugin {
    
    @objc func setRoomInfo(_ call: CAPPluginCall) {
        let roomId = call.getString("roomId") ?? ""
        let token = call.getString("token") ?? ""
        let serverUrl = call.getString("serverUrl") ?? ""
        
        let info = [
            "room_id": roomId,
            "token": token,
            "server_url": serverUrl
        ]
        
        if let jsonData = try? JSONSerialization.data(withJSONObject: info, options: []),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            
            UIPasteboard.general.string = "MINDA_SHARE:" + jsonString
            call.resolve()
        } else {
            call.reject("Lỗi đóng gói JSON Room config")
        }
    }
    
    @objc func startShare(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if #available(iOS 12.0, *) {
                let pickerView = RPSystemBroadcastPickerView(frame: CGRect(x: 0, y: 0, width: 50, height: 50))
                if let bundleId = Bundle.main.bundleIdentifier {
                    pickerView.preferredExtension = bundleId + ".MindaScreenCast"
                }
                pickerView.showsMicrophoneButton = false
                
                guard let window = UIApplication.shared.keyWindow, let rootVC = window.rootViewController else {
                    call.reject("Không tìm thấy màn hình chính")
                    return
                }
                
                pickerView.alpha = 0.01 // Giấu đi nhưng vẫn bắt nó render
                rootVC.view.addSubview(pickerView)
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    func findButton(in view: UIView) -> UIButton? {
                        if let btn = view as? UIButton { return btn }
                        for subview in view.subviews {
                            if let target = findButton(in: subview) { return target }
                        }
                        return nil
                    }
                    
                    if let btn = findButton(in: pickerView) {
                        btn.sendActions(for: .touchUpInside)
                        btn.sendActions(for: .allEvents)
                        
                        // Dọn dẹp sau 1 giây
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                            pickerView.removeFromSuperview()
                        }
                        call.resolve()
                    } else {
                        call.reject("Không tìm thấy lõi Apple ReplayKit Button - View chưa kịp render")
                    }
                }
            } else {
                call.reject("Phải dùng iOS 12 trở lên bạn nhé")
            }
        }
    }
}
