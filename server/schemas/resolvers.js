const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');




const resolvers = {
  Query: {
    user: async (parent, { username }) => {
      return User.findOne({ username });
    },
    users: async () => {
      return User.find();
    },
    me: async (parent, args, context) => {

      try {
        if (context.user) {
          const userData = await User.findOne({ _id: context.user._id });
          return userData;
        }
      } catch (error) {
        console.error(error);
        throw new AuthenticationError('Cannot find a user with this id!');
      }


    },
  },

  Mutation: {

    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect email');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect password!');
      }

      const token = signToken(user);

      return { token, user };
    },

    saveBook: async (parent, { input }, context) => {
      // If context has a `user` property, that means the user executing this mutation has a valid JWT and is logged in

      try {
        if (context.user) {
          return User.findOneAndUpdate(
            { _id: context.user._id },
            {
              $addToSet: { savedBooks: input },
            },
            {
              new: true,
              runValidators: true,
            }
          );
        }
      } catch (error) {
        console.log(error);
        // If user attempts to execute this mutation and isn't logged in, throw an error
        throw new AuthenticationError('You need to be logged in!');
      }
    },

    deleteBook: async (parent, { bookId }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $pull: {
              savedBooks: { bookId }
            }
          },
          { new: true }
        );
      }
      throw new AuthenticationError('You need to be logged in!');
    }
  },

};

module.exports = resolvers;
