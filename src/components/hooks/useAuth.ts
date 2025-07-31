import supabase from "@/db/supabase"
import { useEffect, useState } from "react"

const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: userData, error: sessionError } = await supabase.auth.getUser()
        
        if (sessionError) {
          console.error("Error getting user data:", sessionError)
        }

        let user = userData?.user?.id

        if (!user) {
          const { data, error } = await supabase.auth.signInAnonymously()
          if (error || !data) {
            console.error("Anonymous sign-in failed:", error)
            return
          }
          user = data.user?.id
        }

        setUserId(user || null)
      } catch (error) {
        console.error("Auth initialization failed:", error)
      } finally {
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [])

  return { userId, isInitialized }
}
export default useAuth;