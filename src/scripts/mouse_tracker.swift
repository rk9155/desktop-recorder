import Cocoa

// Define a global event tap
var eventTap: CFMachPort?

func mouseClickCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {
    
    if type == .leftMouseDown || type == .leftMouseUp {
        let location = NSEvent(cgEvent: event)?.locationInWindow ?? NSPoint.zero
        let timestamp = NSEvent(cgEvent: event)?.timestamp ?? 0
        
        let jsonString = """
        {
            "type": "\(type == .leftMouseDown ? "mouseDown" : "mouseUp")",
            "x": \(location.x),
            "y": \(location.y),
            "timestamp": \(Int(timestamp * 1000))
        }
        """
        print(jsonString)
        fflush(stdout)
    }
    
    return Unmanaged.passRetained(event)
}

func startMouseTracking() {
    // Monitor both mouse down and up events
    let eventMask = (1 << CGEventType.leftMouseDown.rawValue) | 
                    (1 << CGEventType.leftMouseUp.rawValue)
    
    guard AXIsProcessTrusted() else {
        print("Error: Accessibility permissions not granted")
        exit(1)
    }
    
    // Create the event tap
    guard let tap = CGEvent.tapCreate(
        tap: .cgAnnotatedSessionEventTap,
        place: .headInsertEventTap,
        options: .defaultTap,
        eventsOfInterest: CGEventMask(eventMask),
        callback: mouseClickCallback,
        userInfo: nil
    ) else {
        print("Failed to create event tap")
        exit(1)
    }
    
    eventTap = tap
    
    // Create and add run loop source
    guard let runLoopSource = CFMachPortCreateRunLoopSource(
        kCFAllocatorDefault,
        tap,
        0
    ) else {
        print("Failed to create run loop source")
        exit(1)
    }
    
    // Add to current run loop
    CFRunLoopAddSource(
        CFRunLoopGetMain(),
        runLoopSource,
        CFRunLoopMode.commonModes
    )
    
    // Enable the event tap
    CGEvent.tapEnable(tap: tap, enable: true)
    
    print("Mouse tracking started successfully")
    fflush(stdout)
}

// Main execution
do {
    print("Initializing mouse tracker...")
    startMouseTracking()
    CFRunLoopRun()
} catch {
    print("Error: \(error.localizedDescription)")
    exit(1)
}
