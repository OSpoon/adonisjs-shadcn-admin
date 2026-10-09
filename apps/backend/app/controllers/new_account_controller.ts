import User from '#models/user'
import DirectoryUser from '#models/directory_user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const { fullName, email, password } = await request.validateUsing(signupValidator)

    const user = await User.create({ fullName, email, password })
    const invitation = await DirectoryUser.findBy('email', email)
    if (invitation?.status === 'invited' && !invitation.authUserId) {
      invitation.authUserId = user.id
      invitation.status = 'active'
      if (fullName) {
        const [firstName, ...lastName] = fullName.trim().split(/\s+/)
        invitation.firstName = firstName || invitation.firstName
        invitation.lastName = lastName.join(' ') || invitation.lastName
      }
      await invitation.save()
    }
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
