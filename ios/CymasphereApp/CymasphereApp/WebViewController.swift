import UIKit
import WebKit

class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private var webView: WKWebView!
    private var loadingIndicator: UIActivityIndicatorView!
    private var refreshButton: UIBarButtonItem!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupNavigationBar()
        setupWebView()
        setupLoadingIndicator()
        loadWebContent()
    }
    
    private func setupNavigationBar() {
        // Create refresh button
        refreshButton = UIBarButtonItem(
            barButtonSystemItem: .refresh,
            target: self,
            action: #selector(refreshButtonTapped)
        )
        
        // Add refresh button to navigation bar
        navigationItem.rightBarButtonItem = refreshButton
        
        // Set navigation bar title
        navigationItem.title = "Cyma Site"
        
        // Make navigation bar visible
        navigationController?.setNavigationBarHidden(false, animated: false)
    }
    
    @objc private func refreshButtonTapped() {
        print("Refresh button tapped")
        refreshButton.isEnabled = false
        webView.reload()
    }
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.preferences.javaScriptEnabled = true
        
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)
        
        // Enable debugging output
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
    }
    
    private func setupLoadingIndicator() {
        loadingIndicator = UIActivityIndicatorView(style: .large)
        loadingIndicator.center = view.center
        loadingIndicator.hidesWhenStopped = true
        view.addSubview(loadingIndicator)
    }
    
    private func loadWebContent() {
        let urlString = "https://cymasphere.com/dashboard"
        print("Initial load - Attempting to load URL: \(urlString)")
        
        guard let url = URL(string: urlString) else {
            print("Error: Invalid URL")
            showError(message: "Invalid URL configuration")
            return
        }
        
        let request = URLRequest(url: url)
        webView.load(request)
        loadingIndicator.startAnimating()
    }
    
    private func showError(message: String) {
        print("Error occurred: \(message)")
        
        // Prevent multiple alerts from showing
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "Retry", style: .default) { [weak self] _ in
                self?.loadWebContent()
            })
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
            
            self.present(alert, animated: true, completion: nil)
        }
    }
    
    // MARK: - WKNavigationDelegate
    
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        print("Started loading...")
        loadingIndicator.startAnimating()
        refreshButton.isEnabled = false
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("Finished loading successfully")
        loadingIndicator.stopAnimating()
        refreshButton.isEnabled = true
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Navigation failed with error: \(error.localizedDescription)")
        loadingIndicator.stopAnimating()
        refreshButton.isEnabled = true
        showError(message: error.localizedDescription)
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Provisional navigation failed with error: \(error.localizedDescription)")
        loadingIndicator.stopAnimating()
        refreshButton.isEnabled = true
        
        // Only show error if it's not a cancelled load
        if (error as NSError).code != NSURLErrorCancelled {
            showError(message: error.localizedDescription)
        }
    }
}

// MARK: - WKURLSchemeHandler
extension WebViewController: WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        // Handle custom URL scheme if needed
    }
    
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // Handle stopping custom URL scheme task if needed
    }
}
