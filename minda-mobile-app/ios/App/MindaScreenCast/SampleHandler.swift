import ReplayKit
import Foundation
import CoreImage
import UIKit

class SampleHandler: RPBroadcastSampleHandler {

    var webSocketTask: URLSessionWebSocketTask?
    var isConnected = false
    let ciContext = CIContext()
    var lastSendTime: Date = Date()
    
    override func broadcastStarted(withSetupInfo setupInfo: [String : NSObject]?) {
        guard let pbString = UIPasteboard.general.string, pbString.hasPrefix("MINDA_SHARE:") else {
            let error = NSError(domain: "MindaScreenCast", code: -1, userInfo: [NSLocalizedDescriptionKey: "Chưa nhận được tín hiệu bắt phòng học từ App chính"])
            finishBroadcastWithError(error)
            return
        }
        
        let jsonStr = pbString.replacingOccurrences(of: "MINDA_SHARE:", with: "")
        guard let jsonData = jsonStr.data(using: .utf8),
              let dict = try? JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: String],
              let roomId = dict["room_id"],
              let token = dict["token"],
              let hostBase = dict["server_url"] else {
            return
        }
        
        let wsHost = hostBase.replacingOccurrences(of: "http", with: "ws")
        let wsUrlString = "\(wsHost)/api/live-sessions/\(roomId)/screen-share?token=\(token)&role=source"
        
        guard let url = URL(string: wsUrlString) else { return }
        
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        isConnected = true
        
        sendPing()
    }
    
    func sendPing() {
        if !isConnected { return }
        webSocketTask?.sendPing(pongReceiveHandler: { [weak self] error in
            DispatchQueue.global().asyncAfter(deadline: .now() + 10.0) {
                self?.sendPing()
            }
        })
    }
    
    override func broadcastPaused() {}
    
    override func broadcastResumed() {}
    
    override func broadcastFinished() {
        isConnected = false
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
    }
    
    override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
        if !isConnected { return }
        
        // Chỉ quét Data Hình Ảnh (Bỏ qua Audio để nhẹ mạng)
        if sampleBufferType == .video {
            let now = Date()
            // Khoá khung hình ở tốc độ tối đa ~10-15 FPS (tiết kiệm băng thông Server)
            if now.timeIntervalSince(lastSendTime) < 0.08 { 
                return
            }
            lastSendTime = now
            
            guard let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
            
            let ciImage = CIImage(cvPixelBuffer: imageBuffer)
            
            // Thu nhỏ khung hình để chống giật lag
            let maxDimension: CGFloat = 800.0
            let scale = min(maxDimension / ciImage.extent.width, maxDimension / ciImage.extent.height, 1.0)
            
            let scaledImage = ciImage.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
            
            guard let cgImage = ciContext.createCGImage(scaledImage, from: scaledImage.extent) else { return }
            let uiImage = UIImage(cgImage: cgImage)
            
            // Ép thành Base64 Binary chuẩn với chất lượng JPEG 40% (Đủ nhìn gân nét GoodNotes)
            guard let jpegData = uiImage.jpegData(compressionQuality: 0.4) else { return }
            
            // Truyền lên Máy chủ Next.js
            let message = URLSessionWebSocketTask.Message.data(jpegData)
            webSocketTask?.send(message) { _ in }
        }
    }
}
