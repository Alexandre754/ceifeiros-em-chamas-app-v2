"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"

interface Member {
  id: number
  name: string
  sex: string
  maritalStatus: string
  spouse: string | null
}

interface SpouseSelectorProps {
  value: string
  onChange: (value: string) => void
  currentMemberSex?: string
  currentMemberId?: number
  disabled?: boolean
}

export const SpouseSelector = ({ 
  value, 
  onChange, 
  currentMemberSex,
  currentMemberId,
  disabled = false 
}: SpouseSelectorProps) => {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchAvailableSpouses()
  }, [currentMemberSex])

  const fetchAvailableSpouses = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bearer_token')
      if (!token) return

      const response = await fetch('/api/members', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Filter members that could be potential spouses:
        // 1. Must have marital status "casado" (married)
        // 2. If currentMemberSex is defined, prefer opposite sex
        // 3. Exclude current member (if editing)
        // 4. Include members without a spouse OR with current member as spouse
        const availableMembers = data.members.filter((member: Member) => {
          // Exclude current member
          if (currentMemberId && member.id === currentMemberId) return false
          
          // Only married members
          if (member.maritalStatus !== 'casado') return false
          
          // Members without spouse or with current value
          if (member.spouse && member.spouse !== value) return false
          
          return true
        })

        // Sort by name
        availableMembers.sort((a: Member, b: Member) => a.name.localeCompare(b.name))
        
        setMembers(availableMembers)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error("Erro ao carregar lista de membros")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Show manual input if no members available or user prefers manual entry
  const showManualInput = members.length === 0 || searchTerm.length > 0

  return (
    <div className="space-y-2">
      <Label htmlFor="spouse">Nome do Cônjuge</Label>
      
      {isLoading ? (
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          <span className="text-sm text-muted-foreground">Carregando membros...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {members.length > 0 && (
            <>
              <Select 
                value={value} 
                onValueChange={onChange}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um membro ou digite manualmente" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar membro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-9"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  {filteredMembers.length > 0 ? (
                    <>
                      {filteredMembers.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
                          <div className="flex items-center gap-2">
                            <span>{member.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({member.sex === 'masculino' ? '♂' : '♀'})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  ) : (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      Nenhum membro encontrado
                    </div>
                  )}
                </SelectContent>
              </Select>
              
              <p className="text-xs text-muted-foreground">
                💡 Selecione da lista ou digite manualmente abaixo
              </p>
            </>
          )}
          
          <Input
            id="spouse"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={members.length > 0 ? "Ou digite o nome manualmente" : "Digite o nome do cônjuge"}
            disabled={disabled}
          />
          
          {members.length === 0 && (
            <p className="text-xs text-muted-foreground">
              ℹ️ Não há outros membros casados cadastrados. Digite o nome manualmente.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
