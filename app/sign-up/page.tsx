import { auth } from '@/auth'
import { LoginButton } from '@/components/login-button'
import { LoginForm } from '@/components/login-form'
import { Separator } from '@/components/ui/separator'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function SignUpPage() {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 fade-in">
      <div className="w-full max-w-md">
        {/* Main card */}
        <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-lg">
          <LoginForm action="sign-up" />
          <Separator className="my-6 bg-border/50" />
          <div className="flex justify-center">
            <LoginButton text="Continue with GitHub" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a 
            href="https://particula.tech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors duration-200"
          >
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 16 16" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Particula logo"
            >
              <g clipPath="url(#clip0_57_35)">
                <path d="M3.70215 0.000976562C5.70471 0.0232722 7.32119 1.65695 7.32129 3.66992C7.32129 3.68355 7.32046 3.69734 7.32031 3.71094H7.32129V7.33984H3.61914V7.33789C1.61655 7.31556 0 5.68296 0 3.66992C6.59472e-07 3.65623 0.000826715 3.64256 0.000976562 3.62891H0V0H3.70215V0.000976562Z" fill="currentColor"></path>
                <path d="M12.3393 15.9587C14.361 15.9587 16 14.3156 16 12.2886C16 10.2617 14.361 8.61853 12.3393 8.61853C10.3176 8.61853 8.67865 10.2617 8.67865 12.2886C8.67865 14.3156 10.3176 15.9587 12.3393 15.9587Z" fill="currentColor"></path>
                <path d="M15.9585 3.71094H15.9575C15.9357 5.719 14.3064 7.33975 12.2983 7.33984C12.2847 7.33984 12.2709 7.33804 12.2573 7.33789V7.33984H8.63721V3.62891H8.63818C8.66021 1.62095 10.2903 0 12.2983 0C12.312 6.47431e-07 12.3257 0.00082557 12.3394 0.000976562V0H15.9585V3.71094Z" fill="currentColor"></path>
                <path d="M7.32129 12.3709H7.32031C7.29838 14.3788 5.669 15.9996 3.66113 15.9998C3.64726 15.9998 3.63297 15.999 3.61914 15.9988V15.9998H0V12.2889H0.000976562C0.0229114 10.2808 1.65306 8.65997 3.66113 8.65997C3.67483 8.65997 3.68849 8.66177 3.70215 8.66193V8.65997H7.32129V12.3709Z" fill="currentColor"></path>
              </g>
              <defs>
                <clipPath id="clip0_57_35">
                  <rect width="16" height="16" fill="white"></rect>
                </clipPath>
              </defs>
            </svg>
            Made by Particula Tech
          </a>
        </div>
      </div>
    </div>
  )
}
