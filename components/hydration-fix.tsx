"use client"

import { useEffect } from "react"

/**
 * Component that handles common hydration issues caused by browser extensions
 * Should be placed early in the component tree
 */
export function HydrationFix() {
  useEffect(() => {
    // Clean up browser extension attributes that cause hydration mismatches
    const cleanupBrowserExtensionAttributes = () => {
      const body = document.body
      const html = document.documentElement
      
      if (body || html) {
        // Remove common browser extension attributes
        const extensionAttributes = [
          'cz-shortcut-listen',
          'grammarly-extension-installed',
          'lastpass-extension-installed',
          'data-new-gr-c-s-check-loaded',
          'data-gr-ext-installed',
          'spellcheck',
          'data-gramm',
          'data-gramm_editor',
          'data-enable-grammarly',
          'data-new-gr-c-s-loaded',
          'data-gr-c-s-loaded',
          'lpformnum',
          'lpform'
        ]
        
        // Clean both body and html elements
        ;[body, html].forEach(element => {
          if (element) {
            extensionAttributes.forEach(attr => {
              if (element.hasAttribute(attr)) {
                element.removeAttribute(attr)
              }
            })
          }
        })
      }
    }

    // Run cleanup immediately and multiple times to catch dynamically added attributes
    const runCleanup = () => {
      cleanupBrowserExtensionAttributes()
      // Run again after a short delay to catch any late additions
      setTimeout(cleanupBrowserExtensionAttributes, 100)
      setTimeout(cleanupBrowserExtensionAttributes, 500)
    }
    
    runCleanup()
    
    // Set up observer to clean up any dynamically added attributes
    const observer = new MutationObserver((mutations) => {
      let shouldCleanup = false
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.target === document.body || mutation.target === document.documentElement)) {
          shouldCleanup = true
        }
      })
      if (shouldCleanup) {
        cleanupBrowserExtensionAttributes()
      }
    })

    // Observe both body and html for attribute changes
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: [
          'cz-shortcut-listen',
          'grammarly-extension-installed', 
          'lastpass-extension-installed',
          'data-new-gr-c-s-check-loaded',
          'data-gr-ext-installed',
          'data-gramm',
          'data-gramm_editor',
          'data-enable-grammarly',
          'lpformnum',
          'lpform'
        ]
      })
    }
    
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [
          'cz-shortcut-listen',
          'grammarly-extension-installed', 
          'lastpass-extension-installed',
          'data-new-gr-c-s-check-loaded',
          'data-gr-ext-installed'
        ]
      })
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
