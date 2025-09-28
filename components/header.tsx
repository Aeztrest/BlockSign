"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { WalletConnectDialog } from "@/components/wallet-connect-dialog"
import { Wallet, Globe, Moon, Sun, Menu, Zap } from "lucide-react"
import { useTheme } from "next-themes"
import { useWallet } from "@/lib/wallet-context"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { wallet, disconnectWallet } = useWallet()
  const { toast } = useToast()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation(language)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [walletDialogOpen, setWalletDialogOpen] = useState(false)

  const navigation = [
    { name: t("home"), href: "/", requiresWallet: false },
    { name: t("dashboard"), href: "/dashboard", requiresWallet: true },
    { name: t("create"), href: "/create", requiresWallet: true },
  ]

  const handleWalletDisconnect = () => {
    disconnectWallet()
  }

  const handleProtectedLinkClick = (e: React.MouseEvent, item: any) => {
    if (item.requiresWallet && !wallet.isConnected) {
      e.preventDefault()
      toast({
        title: t("walletRequired"),
        description: t("walletRequiredDesc"),
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg">SignChain</span>
                <span className="text-xs text-muted-foreground">Algorand-powered e-sign</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleProtectedLinkClick(e, item)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary relative",
                    pathname === item.href
                      ? "text-foreground after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500"
                      : "text-muted-foreground",
                    item.requiresWallet && !wallet.isConnected && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-2">
              {/* Wallet Connection */}
              {!wallet.isConnected ? (
                <Button variant="outline" size="sm" onClick={() => setWalletDialogOpen(true)}>
                  <Wallet className="h-4 w-4 mr-2" />
                  {t("connectWallet")}
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      {wallet.walletType}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {wallet.address?.slice(0, 4)}...{wallet.address?.slice(-4)}
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <div className="flex flex-col">
                        <span className="font-medium">{t("balance")}</span>
                        <span className="text-sm text-muted-foreground">{wallet.balance} ALGO</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleWalletDisconnect}>{t("disconnect")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Globe className="h-4 w-4 mr-1" />
                    {language.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("tr")}>
                    <span className="mr-2">🇹🇷</span>
                    Türkçe
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("en")}>
                    <span className="mr-2">🇺🇸</span>
                    English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      SignChain
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {/* Mobile Navigation Links */}
                    <nav className="flex flex-col space-y-2">
                      {navigation.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={(e) => {
                            handleProtectedLinkClick(e, item)
                            setIsMobileMenuOpen(false)
                          }}
                          className={cn(
                            "px-3 py-2 text-sm font-medium transition-colors hover:text-primary rounded-md",
                            pathname === item.href ? "text-foreground bg-muted" : "text-muted-foreground",
                            item.requiresWallet && !wallet.isConnected && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </nav>

                    {/* Mobile Controls */}
                    <div className="border-t pt-4 space-y-3">
                      {/* Language Selector in Mobile */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Language</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Globe className="h-4 w-4 mr-1" />
                              {language.toUpperCase()}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLanguage("tr")}>
                              <span className="mr-2">🇹🇷</span>
                              Türkçe
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage("en")}>
                              <span className="mr-2">🇺🇸</span>
                              English
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Theme Toggle in Mobile */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Theme</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <WalletConnectDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
    </>
  )
}
