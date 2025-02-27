import { useEffect, useState } from 'react'
import moment from 'moment'
import { Session as SessionType } from 'types/Session'
import { Speaker } from 'types/Speaker'
import { Room } from 'types/Room'
import { defaultSlugify } from 'utils/formatting'
import { APP_CONFIG } from 'utils/config'
import { useRecoilState } from 'recoil'
import { sessionsAtom, speakersAtom } from 'pages/_app'

const cache = new Map()
const baseUrl = APP_CONFIG.API_BASE_URL
const eventName = 'devcon-7' // 'devcon-vi-2022' // 'devcon-vi-2022' // 'pwa-data'
const websiteQuestionId = 29
const twitterQuestionId = 44
const githubQuestionId = 43
const organizationQuestionId = 23 // not used
const roleQuestionId = 24 // not used

export const useSessionData = (): SessionType[] | null => {
  // const [sessions, setSessions] = useState<SessionType[] | null>(null)
  const [sessions, setSessions] = useRecoilState(sessionsAtom)
  const version = useEventVersion()

  useEffect(() => {
    if (version) {
      fetchSessions(version).then(setSessions)
    }
  }, [version])

  return sessions
}

export const useSpeakerData = (): Speaker[] | null => {
  const [speakers, setSpeakers] = useRecoilState(speakersAtom)
  const version = useEventVersion()

  useEffect(() => {
    if (version) {
      fetchSpeakers(version).then(setSpeakers)
    }
  }, [version])

  return speakers
}

export const useEventVersion = () => {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    // Whenever version changes or the service worker installs for the first time, we want to repopulate the cache immediately
    const fillEventCache = () => {
      fetchEventVersion().then(setVersion)

      if (version) {
        // This will use the http cache if multiple requests are sent in close succession, so it's not wasteful
        fetchSessions(version)
        fetchSpeakers(version)
      }
    }

    fillEventCache()

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', fillEventCache)
    }

    return () => {
      // Remove the service worker update listener if it was added
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', fillEventCache)
      }
    }
  }, [version])

  useEffect(() => {
    fetchEventVersion().then(setVersion)

    const onWindowFocus = () => {
      fetchEventVersion().then(setVersion)
    }

    window.addEventListener('focus', onWindowFocus)

    return () => {
      window.removeEventListener('focus', onWindowFocus)
    }
  }, [])

  return version
}

export const useSpeakersWithSessions = () => {
  const [speakersWithSessions, setSpeakersWithSessions] = useState<any>(null)
  const sessions = useSessionData()
  const speakers = useSpeakerData()

  useEffect(() => {
    if (sessions && speakers) {
      const sessionsBySpeakerId: any = {}

      sessions.forEach(session => {
        session.speakers.forEach(speaker => {
          if (sessionsBySpeakerId[speaker.id]) {
            sessionsBySpeakerId[speaker.id].push(session)
          } else {
            sessionsBySpeakerId[speaker.id] = [session]
          }
        })
      })

      const speakersWithSessions = speakers.map(speaker => {
        return {
          ...speaker,
          sessions: sessionsBySpeakerId[speaker.id] ? sessionsBySpeakerId[speaker.id]
            .map((session: SessionType) => {
              if (!session.slot_start || !session.slot_end) return null
                return session
              })
              .filter(Boolean)
            : [],
        }
      })

      setSpeakersWithSessions(speakersWithSessions)
    }
  }, [sessions, speakers])

  return speakersWithSessions
}

// Simple endpoint we can ping to see if event data updated - we append this to requests to speakers and sessions to break their caches
export const fetchEventVersion = async (): Promise<string> => {
  const version = await get(`/events/${eventName}/version`)

  return version
}

const modifySessionEndTime = (session: SessionType) => {
  let modifiedEndTime = moment.utc(session.slot_end)

  if (session.track.includes('[CLS]') || session.track.includes('Entertainment') || session.type === 'Mixed Formats') {
    // No change
  } else if (session.type === 'Lightning Talk') {
    modifiedEndTime = modifiedEndTime.subtract(3, 'minutes')
  } else if (session.type === 'Workshop') {
    modifiedEndTime = modifiedEndTime.subtract(10, 'minutes')
  } else {
    modifiedEndTime = modifiedEndTime.subtract(5, 'minutes')
  }

  return {
    ...session,
    slot_end: modifiedEndTime.valueOf(),
  }
}

export const fetchSessions = async (version?: string): Promise<SessionType[]> => {
  // const sessions = await get(`/events/${eventName}/sessions?sort=slot_start&size=1000&version=${version}`)
  const sessions = await get(`/sessions?sort=slot_start&order=asc&event=${eventName}&size=1000&version=${version}`)

  return sessions
    .map((session: SessionType) => {
      if (!session.slot_start || !session.slot_end) return null

      // const startTS = moment.utc(session.slot_start).add(7, 'hours')
      // const endTS = moment.utc(session.slot_end).add(7, 'hours')



      return {
        ...modifySessionEndTime(session),
        // start: startTS.valueOf(),
        // slot_end: modifiedEndTime.valueOf(),
        // duration: startTS.diff(endTS, 'minutes'),
      }
    })
    .filter(Boolean)
    .sort((a: SessionType, b: SessionType) => {
      // First sort by start time
      const startDiff = moment.utc(a.slot_start).diff(moment.utc(b.slot_start))
      // If start times are equal, sort by end time
      if (startDiff === 0) {
        return moment.utc(a.slot_end).diff(moment.utc(b.slot_end))
      }
      return startDiff
    })
}

export const fetchSpeakers = async (version?: string): Promise<Speaker[]> => {
  const sessions = await fetchSessions(version)
  const speakersData = await get(`/speakers?event=${eventName}&size=1100&version=${version}`)
  const speakers = speakersData.map((i: any) => {
    const speakerSessions = sessions.filter((session: SessionType) =>
      session.speakers.some(speaker => i.id === speaker.id)
    )
    const organization = i.answers?.filter((i: any) => i.question.id === organizationQuestionId).reverse()[0]?.answer
    const role = i.answers?.filter((i: any) => i.question.id === roleQuestionId).reverse()[0]?.answer
    const website = i.answers?.filter((i: any) => i.question.id === websiteQuestionId).reverse()[0]?.answer
    const twitter = i.answers?.filter((i: any) => i.question.id === twitterQuestionId).reverse()[0]?.answer
    const github = i.answers?.filter((i: any) => i.question.id === githubQuestionId).reverse()[0]?.answer

    const speaker: any = {
      ...i,
      tracks: [...new Set(speakerSessions.map(i => i.track))],
      eventDays: [...new Set(speakerSessions.map(i => moment.utc(i.start).startOf('day').valueOf()))],
      sessions: speakerSessions,
    }

    if (role) speaker.role = role
    if (organization) speaker.company = organization
    if (website) speaker.website = website
    if (twitter) speaker.twitter = twitter
    if (github) speaker.github = github

    return speaker
  })

  return speakers
}

export const fetchEvent = async (): Promise<any> => {
  const event = await get(`/events/${eventName}`)

  return event
}

export const fetchSessionsBySpeaker = async (id: string): Promise<Array<SessionType>> => {
  return await get(`/speakers/${id}/sessions?event=${eventName}`)
}

export const fetchSessionsByRoom = async (id: string): Promise<Array<SessionType>> => {
  return await get(`/sessions?room=${id}&event=${eventName}`)
}

export const fetchExpertiseLevels = async (): Promise<Array<string>> => {
  return Array.from(
    (await fetchSessions()).reduce((acc: Set<string>, session: SessionType) => {
      if (session.expertise) {
        acc.add(session.expertise)
      }

      return acc
    }, new Set<string>())
  )
}

export const fetchSessionTypes = async (): Promise<Array<string>> => {
  return Array.from(
    (await fetchSessions()).reduce((acc: Set<string>, session: SessionType) => {
      if (session.type) {
        acc.add(session.type)
      }

      return acc
    }, new Set<string>())
  )
}

export const fetchTracks = async (): Promise<Array<string>> => {
  // no endpoint exists, so fetches and filters all sessions recursively
  const tracks = (await fetchSessions()).map(i => i.track)
  return [...new Set(tracks)].sort()
}

export const fetchEventDays = async (): Promise<Array<number>> => {
  // no endpoint exists, so fetches and filters all sessions recursively
  const days = (await fetchSessions()).map(i => moment.utc(i.start).startOf('day').valueOf())
  return [...new Set(days)].sort()
}

export const fetchRooms = async (): Promise<Array<Room>> => {
  const rooms = await get(`/events/${eventName}/rooms`)

  return rooms.map((room: Room) => {
    return {
      ...room,
      id: room.name ? defaultSlugify(room.name) : String(room.id),
    }
  })
}

export const fetchFloors = async (): Promise<Array<Room>> => {
  const rooms = await fetchRooms()

  return rooms || []
  // return [...new Set(rooms.map(i => i.info).filter(Boolean))]
}

export const fetchSpeaker = async (id: string): Promise<Speaker | undefined> => {
  const speaker = await get(`/speakers/${id}`)

  if (!speaker || speaker.detail === 'Not found.') return undefined

  return {
    ...speaker,
    sessions: speaker.sessions?.filter((i: any) => i.eventId === eventName).map(modifySessionEndTime),
  }
}

async function get(slug: string) {
  // Never cache version
  if (cache.has(slug) && !slug.endsWith('/version')) {
    return cache.get(slug)
  }

  // https://api.devcon.org/events/devcon-7/sessions?size=1000&version=1.0.0

  const response = await fetch(`${baseUrl}${slug}`).then(resp => resp.json())
  // const response = await fetch(`${'https://api.devcon.org'}${slug}`).then(resp => resp.json())

  let data = response

  // Extract nested items when using api.devcon.org
  if (response.data) data = response.data
  if (response.data?.items) data = response.data.items

  cache.set(slug, data)

  return data
}
