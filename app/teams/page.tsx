import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { getUserTeams } from '@/app/team-actions'
import { TeamCard } from '@/components/team-card'
import { CreateTeamForm } from '@/components/create-team-form'
import { JoinTeamForm } from '@/components/join-team-form'
import { IconUsers } from '@/components/ui/icons'

export default async function TeamsPage() {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const teams = await getUserTeams(session.user.id)

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
          Команды
        </h1>
        <p className="text-muted-foreground">
          Сотрудничайте с участниками команды в ИИ-диалогах
        </p>
      </div>

      {}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold">Присоединиться к команде</h2>
        <div className="rounded-lg border border-border/60 p-4">
          <div className="space-y-3 text-center">
            <h3 className="text-base font-medium">Есть код присоединения?</h3>
            <p className="text-sm text-muted-foreground">
              Присоединитесь к существующей команде для начала совместной работы
            </p>
            <JoinTeamForm />
          </div>
        </div>
      </div>

      {}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Мои команды</h2>
          <CreateTeamForm />
        </div>

        {teams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
            <div className="space-y-3">
              <h3 className="text-base font-medium">Команд пока нет</h3>
              <p className="text-sm text-muted-foreground">
                Создайте свою команду или используйте код присоединения для
                участия в существующей
              </p>
              <div className="pt-2">
                <CreateTeamForm />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
