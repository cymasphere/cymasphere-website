# Cymasphere App iOS Wrapper

This is a simple iOS application that wraps the Cymasphere web application in a native iOS WebView.

## Requirements

- Xcode 13.0 or later
- iOS 14.0 or later
- Active Apple Developer account (for deployment to App Store)

## Setup Instructions

1. Open the `CymasphereApp.xcodeproj` file in Xcode
2. Update the Bundle Identifier in the project settings to match your Apple Developer account
3. In `WebViewController.swift`, update the URL to point to your deployed web application (currently set to `https://cymasphere.com`)
4. Build and run the application in Xcode

## Configuration

The app is configured to:
- Support both portrait and landscape orientations
- Allow arbitrary loads for development (you may want to restrict this for production)
- Handle basic web navigation and error states
- Show a loading indicator while content is being loaded

## Development Notes

- The app uses WKWebView for optimal web performance
- Local development requires the web application to be running (default: http://localhost:3000)
- For production deployment, update the URL in `WebViewController.swift` to your production URL

## Security Considerations

- For production deployment, update the NSAppTransportSecurity settings in Info.plist to only allow your specific domain
- Consider implementing SSL certificate pinning for additional security
- Review and update the allowed orientations and device capabilities as needed

## Generating the Xcode Project

If you're using XcodeGen, run:

```bash
xcodegen generate
```

This will generate the `CymasphereApp.xcodeproj` file from the `project.yml` configuration.
